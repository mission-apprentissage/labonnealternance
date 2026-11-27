import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { PREFIX } from "./lib/decide.mjs"
import { editTarget, postEdit } from "./lib/post-edit.mjs"
import { headCommit, isLbaRoot, realpathOrSelf, toplevel } from "./lib/repo.mjs"
import { markOnce, sessionDir } from "./lib/state.mjs"
import { explain, status } from "./lib/status.mjs"
import { sessionStart, stop } from "./lib/stop.mjs"
import { pickNode } from "./lib/tools.mjs"

const SCRIPTS_ROOT = realpathOrSelf(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."))
const HOOK_COMMANDS = new Set(["post-edit", "stop", "session-start", "explain"])

function option(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

/**
 * Le câblage lance les scripts du checkout principal ($CLAUDE_PROJECT_DIR) ; le worktree de la session est le `cwd` de la
 * charge. Ses propres scripts passent en premier, pour que scripts et code vérifié viennent du même commit.
 */
function delegate(script, root, argv, raw) {
  const node = pickNode(root) ?? process.execPath
  const run = spawnSync(node, [script, ...argv], { input: raw, stdio: ["pipe", "inherit", "inherit"], env: { ...process.env, LBA_HOOKS_DELEGATED: "1" } })
  if (run.error) return { exit: 1, stderr: `${PREFIX} scripts du worktree non lancés : ${run.error.message}` }
  return { exit: run.status === 2 ? 2 : run.status === 0 ? 0 : 1 }
}

function fallbackNotice(root) {
  const message = `${PREFIX} Scripts de vérification absents de ce worktree (${root}) : ceux du checkout principal (${headCommit(SCRIPTS_ROOT)}) sont utilisés.`
  return (state, key) => (markOnce(join(sessionDir(state, key), "scripts-fallback")) ? message : null)
}

async function main(argv) {
  const [command, ...args] = argv
  const env = process.env
  if (env.LBA_HOOKS === "off") return { exit: 0 }
  const strict = env.LBA_HOOKS_STRICT === "1"

  if (command === "status") {
    const root = toplevel(resolve(option(args, "--cwd") ?? process.cwd()))
    if (!root) return { exit: 1, stderr: `${PREFIX} status : hors dépôt git` }
    return status({ root, all: args.includes("--all"), strict: strict || args.includes("--strict"), json: args.includes("--json") })
  }
  if (!HOOK_COMMANDS.has(command)) return { exit: 1, stderr: `${PREFIX} commande inconnue : ${command ?? "(aucune)"}` }

  const raw = readFileSync(0, "utf8")
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return { exit: 1, stderr: `${PREFIX} stdin illisible : charge JSON attendue` }
  }
  if (!payload || typeof payload !== "object") return { exit: 1, stderr: `${PREFIX} stdin illisible : objet JSON attendu` }

  const root = command === "post-edit" ? (editTarget(payload)?.root ?? toplevel(payload.cwd)) : toplevel(payload.cwd)
  if (!isLbaRoot(root)) return { exit: 0 }

  const ownScripts = join(root, ".claude", "hooks", "cli.mjs")
  if (root !== SCRIPTS_ROOT && !env.LBA_HOOKS_DELEGATED && existsSync(ownScripts)) return delegate(ownScripts, root, argv, raw)

  const ctx = { payload, env, root, strict, fallbackNotice: root !== SCRIPTS_ROOT && !existsSync(ownScripts) ? fallbackNotice(root) : null }
  switch (command) {
    case "post-edit":
      return postEdit(ctx)
    case "stop":
      return stop(ctx)
    case "session-start":
      return sessionStart(ctx)
    default:
      return explain(ctx)
  }
}

function write(stream, text) {
  return new Promise((done) => (text ? stream.write(`${text}\n`, done) : done()))
}

// Toute exception sort en 1 : un code 2 bloquerait la session sur une erreur du script lui-même.
const result = await main(process.argv.slice(2)).catch((error) => ({
  exit: 1,
  stderr: `${PREFIX} erreur interne : ${String(error?.stack ?? error)
    .split("\n")
    .slice(0, 3)
    .join(" | ")}`,
}))
// Pour un hook, stdout n'est lu qu'en code 0 : en code 1, un JSON valide y serait encore traité comme une décision.
if (result.exit === 0 || !HOOK_COMMANDS.has(process.argv[2])) await write(process.stdout, result.stdout)
await write(process.stderr, result.stderr)
process.exit(result.exit)
