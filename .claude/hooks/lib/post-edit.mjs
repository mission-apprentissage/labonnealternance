import { existsSync, mkdirSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"

import { attachNotice, DEFAULTS, formatEditLint, isLintable, PREFIX } from "./decide.mjs"
import { isIgnored, isLbaRoot, realpathOrSelf, toplevel } from "./repo.mjs"
import { appendLine, markOnce, sessionDir, sessionKey, stateDir } from "./state.mjs"
import { binPath, biomeFileCount, parseBiomeReport, runTool } from "./tools.mjs"

const EDIT_TOOLS = new Set(["Edit", "MultiEdit", "Write"])

/** Fichier visé par une édition : chemin réel, racine git et chemin relatif, ou null hors dépôt LBA. */
export function editTarget(payload) {
  const raw = payload?.tool_input?.file_path
  if (!EDIT_TOOLS.has(payload?.tool_name) || typeof raw !== "string" || !raw) return null
  const file = resolve(payload.cwd ?? "/", raw)
  if (!existsSync(file) || !statSync(file).isFile()) return null
  const real = realpathOrSelf(file)
  const root = toplevel(dirname(real))
  if (!isLbaRoot(root)) return null
  return { file: real, root, rel: relative(root, real) }
}

/** Lint du fichier qui vient d'être édité, sans --write : la correction automatique passe une fois, en fin de tour. */
export async function postEdit(ctx) {
  const { payload, env } = ctx
  const mode = env.LBA_HOOKS_EDIT_LINT ?? "fast"
  if (mode === "off") return { exit: 0 }
  const target = editTarget(payload)
  if (!target) return { exit: 0 }
  const { root, rel } = target

  const state = stateDir(root)
  const key = sessionKey(payload)
  const session = sessionDir(state, key)
  if (payload.tool_use_id) {
    const seen = join(session, "seen")
    mkdirSync(seen, { recursive: true })
    if (!markOnce(join(seen, String(payload.tool_use_id).replace(/[^A-Za-z0-9._-]/g, "_")))) return { exit: 0 }
  }
  appendLine(join(session, "edits"), rel)
  const emit = (result) => attachNotice(result, ctx.fallbackNotice?.(state, key))

  if (isIgnored(root, rel) || !isLintable(rel)) return emit({ exit: 0 })

  const biome = binPath(root, "biome")
  if (!existsSync(biome)) {
    const message = `${PREFIX} Biome introuvable dans ${join(root, "node_modules")} : lint non exécuté. Lance \`yarn install\`.`
    if (ctx.strict) return emit({ exit: 2, stderr: message })
    const first = markOnce(join(session, "biome-missing"))
    return emit(first ? { exit: 1, stderr: message } : { exit: 0 })
  }

  const skips = mode === "full" ? [] : ["--skip=types", "--skip=correctness/noUnusedVariables"]
  const run = await runTool(biome, ["lint", "--reporter=json", "--colors=off", "--no-errors-on-unmatched", ...skips, rel], {
    cwd: root,
    timeoutMs: Number(env.LBA_HOOKS_EDIT_LINT_MS) || DEFAULTS.editLintMs,
    captureStdout: true,
  })
  if (run.timedOut) return emit({ exit: 1, stderr: `${PREFIX} Biome : délai dépassé sur ${rel}, lint non vérifié` })
  if (run.error) return emit({ exit: 1, stderr: `${PREFIX} Biome n'a pas démarré : ${run.error.message.split("\n")[0]}` })
  let report
  try {
    report = parseBiomeReport(run.stdout)
  } catch (error) {
    return emit({ exit: 1, stderr: `${PREFIX} Biome (code ${run.code}) : ${error.message}` })
  }
  if (biomeFileCount(report.summary) === 0 || report.summary.errors === 0) return emit({ exit: 0 })
  return emit({ exit: 2, stderr: formatEditLint(rel, report.diagnostics, report.summary.errors) })
}
