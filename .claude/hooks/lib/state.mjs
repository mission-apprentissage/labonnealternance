import { appendFileSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setTimeout as sleep } from "node:timers/promises"

import { commonDir, gitDir } from "./repo.mjs"

/** État d'un worktree, dans son dossier git : hors arbre de travail, donc hors empreinte, et supprimé avec le worktree. */
export function stateDir(root) {
  const dir = join(gitDir(root), "lba-hooks")
  mkdirSync(dir, { recursive: true })
  return dir
}

export function sessionRootsDir(root) {
  const dir = join(commonDir(root), "lba-hooks", "session-roots")
  mkdirSync(dir, { recursive: true })
  return dir
}

const safe = (value) => String(value).replace(/[^A-Za-z0-9._-]/g, "_")

export function sessionKey(payload) {
  const base = safe(payload.session_id ?? "sans-session")
  return payload.agent_id ? `${base}.${safe(payload.agent_id)}` : base
}

export function sessionDir(state, key) {
  const dir = join(state, "sessions", key)
  mkdirSync(dir, { recursive: true })
  return dir
}

export function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return fallback
  }
}

export function writeJson(path, value) {
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`)
  renameSync(tmp, path)
}

export function readText(path) {
  try {
    return readFileSync(path, "utf8").trim() || null
  } catch {
    return null
  }
}

/** Crée le marqueur s'il n'existe pas ; false s'il existait déjà. */
export function markOnce(path) {
  try {
    writeFileSync(path, `${new Date().toISOString()}\n`, { flag: "wx" })
    return true
  } catch (error) {
    if (error.code === "EEXIST") return false
    throw error
  }
}

export function notifiedCauses(dir) {
  try {
    return readdirSync(join(dir, "notified"))
  } catch {
    return []
  }
}

export function markNotified(dir, ids) {
  mkdirSync(join(dir, "notified"), { recursive: true })
  for (const id of ids) markOnce(join(dir, "notified", safe(id)))
}

export function appendLine(path, line) {
  appendFileSync(path, `${line}\n`)
}

function alive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code === "EPERM"
  }
}

/**
 * Verrou `mkdir` de la garde d'un worktree. Un second départ de la même session attend la fin du premier puis s'efface ;
 * une autre session attend son tour. Un verrou dont le PID est mort est repris.
 * @returns {Promise<{acquired: true, release: () => void} | {acquired: false, duplicate: boolean}>}
 */
export async function acquireLock(state, key, { timeoutMs, pollMs = 100 }) {
  const dir = join(state, "lock")
  const deadline = Date.now() + timeoutMs
  let duplicate = false
  for (;;) {
    try {
      mkdirSync(dir)
      writeFileSync(join(dir, "owner.json"), JSON.stringify({ pid: process.pid, key, at: new Date().toISOString() }))
      if (duplicate) {
        rmSync(dir, { recursive: true, force: true })
        return { acquired: false, duplicate: true }
      }
      return { acquired: true, release: () => rmSync(dir, { recursive: true, force: true }) }
    } catch (error) {
      if (error.code !== "EEXIST") throw error
    }
    const owner = readJson(join(dir, "owner.json"))
    if (owner && !alive(owner.pid)) {
      rmSync(dir, { recursive: true, force: true })
      continue
    }
    if (owner?.key === key) duplicate = true
    if (Date.now() > deadline) return { acquired: false, duplicate }
    await sleep(pollMs)
  }
}

/** Créneau de tests sur la machine (`mkdir`), pour borner les runs Vitest simultanés de tous les worktrees. */
export async function acquireSlot({ max, timeoutMs, dir = process.env.LBA_HOOKS_SLOTS_DIR || join(tmpdir(), `lba-hooks-${process.getuid?.() ?? "u"}`, "slots") }) {
  mkdirSync(dir, { recursive: true })
  const deadline = Date.now() + timeoutMs
  for (;;) {
    for (let i = 0; i < max; i++) {
      const slot = join(dir, String(i))
      try {
        mkdirSync(slot)
        writeFileSync(join(slot, "pid"), String(process.pid))
        return () => rmSync(slot, { recursive: true, force: true })
      } catch (error) {
        if (error.code !== "EEXIST") throw error
        const pid = Number(readText(join(slot, "pid")))
        if (pid && !alive(pid)) rmSync(slot, { recursive: true, force: true })
      }
    }
    if (Date.now() > deadline) return null
    await sleep(250)
  }
}

export function newLogDir(state) {
  const root = join(state, "logs")
  mkdirSync(root, { recursive: true })
  const runs = readdirSync(root).sort()
  for (const old of runs.slice(0, Math.max(0, runs.length - 9))) rmSync(join(root, old), { recursive: true, force: true })
  const dir = join(root, `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`)
  mkdirSync(dir)
  return dir
}
