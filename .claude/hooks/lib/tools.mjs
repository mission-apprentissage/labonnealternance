import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { closeSync, existsSync, openSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { deserialize } from "node:v8"
import { gunzipSync } from "node:zlib"

export function binPath(root, name) {
  return join(root, "node_modules", ".bin", name)
}

/** Les binaires de node_modules/.bin démarrent par `env node` : le Node du hook passe en tête du PATH. */
export function toolEnv(extra = {}) {
  return { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH ?? ""}`, FORCE_COLOR: "0", NO_COLOR: "1", ...extra }
}

/**
 * Lance un outil dans son propre groupe de processus, tué en entier au délai.
 * @returns {Promise<{code: number | null, signal: string | null, timedOut: boolean, stdout: string, error?: Error}>}
 */
export function runTool(cmd, args, { cwd, timeoutMs, logFile, captureStdout = false, env = toolEnv() }) {
  return new Promise((resolvePromise) => {
    const log = logFile ? openSync(logFile, "a") : "ignore"
    let child
    try {
      child = spawn(cmd, args, { cwd, env, detached: true, stdio: ["ignore", captureStdout ? "pipe" : log, log] })
    } catch (error) {
      if (logFile) closeSync(log)
      resolvePromise({ code: null, signal: null, timedOut: false, stdout: "", error })
      return
    }
    const chunks = []
    child.stdout?.on("data", (chunk) => chunks.push(chunk))
    let timedOut = false
    const kill = (signal) => {
      try {
        process.kill(-child.pid, signal)
      } catch {
        // groupe déjà terminé
      }
    }
    const timer = setTimeout(() => {
      timedOut = true
      kill("SIGTERM")
      setTimeout(() => kill("SIGKILL"), 2_000).unref()
    }, timeoutMs)
    child.on("error", (error) => {
      clearTimeout(timer)
      if (logFile) closeSync(log)
      resolvePromise({ code: null, signal: null, timedOut, stdout: "", error })
    })
    child.on("close", (code, signal) => {
      clearTimeout(timer)
      if (logFile) closeSync(log)
      resolvePromise({ code, signal, timedOut, stdout: Buffer.concat(chunks).toString("utf8") })
    })
  })
}

/** Rapport `--reporter=json` de Biome : `summary.errors` fait foi (un fichier absent y produit un diagnostic sans erreur comptée). */
export function parseBiomeReport(stdout) {
  const start = stdout.indexOf("{")
  if (start < 0) throw new Error("rapport Biome illisible")
  const report = JSON.parse(stdout.slice(start))
  if (typeof report?.summary?.errors !== "number") throw new Error("rapport Biome sans summary.errors")
  return { summary: report.summary, diagnostics: report.diagnostics ?? [] }
}

export function biomeFileCount(summary) {
  return (summary.changed ?? 0) + (summary.unchanged ?? 0)
}

export function parseTscErrors(text) {
  return text.split("\n").filter((line) => /\(\d+,\d+\): error TS\d+/.test(line) || /^error TS\d+/.test(line))
}

export function parseVitestReport(json) {
  const results = json.testResults ?? []
  const failures = []
  for (const file of results) {
    const failed = (file.assertionResults ?? []).filter((test) => test.status === "failed")
    for (const test of failed) failures.push({ file: file.name, title: test.fullName ?? test.title, message: (test.failureMessages ?? [])[0] ?? "" })
    if (file.status === "failed" && !failed.length) failures.push({ file: file.name, title: "(fichier)", message: file.message ?? "" })
  }
  return { files: results.length, failedFiles: results.filter((file) => file.status === "failed").length, failures, success: json.success !== false }
}

export function readEnvFiles(paths) {
  const values = {}
  for (const path of paths) {
    let text
    try {
      text = readFileSync(path, "utf8")
    } catch {
      continue
    }
    for (const line of text.split("\n")) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) continue
      values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2")
    }
  }
  return values
}

/** URI Mongo des tests (server/.env.test, surchargé par .env.test.local comme loadEnvForTests), hôte affichable sans identifiants. */
export function testMongoTarget(root) {
  const env = readEnvFiles([join(root, "server/.env.test"), join(root, "server/.env.test.local")])
  const uri = env.LBA_MONGODB_URI?.replace("VITEST_POOL_ID", "")
  if (!uri) return null
  let host = "?"
  try {
    host = new URL(uri).host
  } catch {
    // URI non analysable : l'hôte reste « ? »
  }
  return { uri, host }
}

export async function probeMongo(root, timeoutMs) {
  const target = testMongoTarget(root)
  if (!target) return { ok: false, detail: "LBA_MONGODB_URI absent de server/.env.test" }
  let MongoClient
  try {
    ;({ MongoClient } = createRequire(join(root, "server", "package.json"))("mongodb"))
  } catch {
    return { ok: false, detail: `${target.host}, driver mongodb introuvable` }
  }
  const client = new MongoClient(target.uri, { serverSelectionTimeoutMS: timeoutMs, connectTimeoutMS: timeoutMs, socketTimeoutMS: timeoutMs })
  try {
    await client.db("admin").command({ ping: 1 })
    return { ok: true, detail: target.host }
  } catch (error) {
    return { ok: false, detail: `${target.host}, ${String(error?.message ?? error).split("\n")[0]}` }
  } finally {
    await client.close(true).catch(() => undefined)
  }
}

/**
 * Fraîcheur de node_modules. Yarn ne réécrit ni .yarn-state.yml ni install-state.gz quand rien ne change : une comparaison de
 * dates resterait « périmée » après un checkout qui touche yarn.lock. On compare le lockFileChecksum que Yarn mémorise
 * (sha512 de "1" + yarn.lock dans Yarn 3, cf. contracts.test.mjs) au yarn.lock courant.
 * @returns {{status: "fresh" | "stale" | "missing", detail?: string}}
 */
export function depsState(root) {
  if (!existsSync(join(root, "node_modules"))) return { status: "missing" }
  let lock
  try {
    lock = readFileSync(join(root, "yarn.lock"), "utf8")
  } catch {
    return { status: "fresh" }
  }
  let state
  try {
    state = deserialize(gunzipSync(readFileSync(join(root, ".yarn", "install-state.gz"))))
  } catch {
    return { status: "stale", detail: ".yarn/install-state.gz absent ou illisible" }
  }
  return state?.lockFileChecksum === lockfileChecksum(lock) ? { status: "fresh" } : { status: "stale", detail: "yarn.lock modifié depuis le dernier yarn install" }
}

export function lockfileChecksum(content) {
  return createHash("sha512").update(`1${content}`).digest("hex")
}

export function expectedNode(root) {
  try {
    const raw = readFileSync(join(root, ".node-version"), "utf8").trim()
    return raw ? (raw.startsWith("v") ? raw : `v${raw}`) : null
  } catch {
    return null
  }
}

/** Node de .node-version s'il est installé par nvm. */
export function pickNode(root) {
  const version = expectedNode(root)
  if (!version) return null
  if (version === process.version) return process.execPath
  const candidate = join(process.env.HOME || homedir(), ".nvm", "versions", "node", version, "bin", "node")
  return existsSync(candidate) ? candidate : null
}
