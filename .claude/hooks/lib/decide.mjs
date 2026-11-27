import { basename, dirname, extname } from "node:path"

export const PREFIX = "[lba-hooks]"

// Posé par l'isolation des bases de test par worktree : sans lui, deux worktrees partagent les bases lba-test-*
// et le teardown de l'un supprime celles de l'autre.
export const DB_ISOLATION_MARKER = "server/tests/utils/test-database.ts"

// Extensions de package.json["lint-staged"], cf. decide.test.mjs.
export const LINT_EXTENSIONS = ["cjs", "js", "json", "jsonc", "jsx", "mjs", "ts", "tsx"]

// Projets Vitest par dossier, cf. decide.test.mjs.
export const WORKSPACE_PROJECTS = {
  server: ["server", "server-isolated"],
  ui: ["ui"],
  shared: ["shared"],
  ".claude/hooks": ["hooks"],
}
export const SERVER_PROJECTS = ["server", "server-isolated"]
// Les tests server et ui importent shared/dist par le lien node_modules/shared.
const SHARED_CONSUMERS = ["server", "server-isolated", "shared", "ui"]

const BIOME_EXTENSIONS = new Set([...LINT_EXTENSIONS, "css", "cts", "gql", "graphql", "grit", "mts"])
const IMPORTABLE = /\.[cm]?[jt]sx?$/
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/
const TYPED = /\.[cm]?tsx?$/
const ASSET = /\.(csv|ejs|hbs|html|json|mjml|snap|txt|xml|ya?ml)$/
const ROOT_CONFIGS = new Set([".node-version", ".yarnrc.yml", "biome.json", "package.json", "tsconfig.json", "vitest.config.ts", "yarn.lock"])

// Jamais passés à `vitest related` : les forceRerunTriggers de Vitest relanceraient toute la suite, et aucun test n'importe
// un fichier de setup (cf. decide.test.mjs). La suite complète reste le check CI `tests / Tests`.
const GLOBAL_FILES = new Set([
  ".node-version",
  ".yarnrc.yml",
  "server/.env.test",
  "server/tests/utils/globalSetup.ts",
  "server/tests/utils/setup.ts",
  "ui/tests/setup.ts",
  "yarn.lock",
])

export const DEFAULTS = {
  maxBlocks: 3,
  maxBlocksPerWindow: 6,
  windowMs: 30 * 60 * 1000,
  maxRelatedFiles: 60,
  budgetMs: 240_000,
  biomeMs: 30_000,
  tscMs: 90_000,
  editLintMs: 10_000,
  mongoMs: 1_500,
  testWorkers: 3,
  parallelTests: 2,
}

export function extensionOf(path) {
  return extname(path).slice(1).toLowerCase()
}

export function workspaceOf(path) {
  return Object.keys(WORKSPACE_PROJECTS).find((ws) => path.startsWith(`${ws}/`)) ?? null
}

export function isLintable(path) {
  return LINT_EXTENSIONS.includes(extensionOf(path))
}

export function isTestFile(path) {
  return TEST_FILE.test(path)
}

export function isGlobalTrigger(path) {
  const name = basename(path)
  return GLOBAL_FILES.has(path) || name === "package.json" || /^(vite|vitest)\.(config|workspace)\./.test(name) || /^tsconfig.*\.json$/.test(name)
}

// Périmètre de la garde de fin de tour : un fichier hors périmètre (docs/, .github/*.yml, *.md) ne lance aucun outil.
export function inScope(path) {
  if (ROOT_CONFIGS.has(path) || BIOME_EXTENSIONS.has(extensionOf(path))) return true
  const ws = workspaceOf(path)
  if (ws === ".claude/hooks") return true
  return ws !== null && (IMPORTABLE.test(path) || ASSET.test(path))
}

export function needsTypecheck(paths) {
  return paths.some((path) => TYPED.test(path) || isGlobalTrigger(path))
}

/**
 * Traduit les fichiers modifiés en invocation `vitest related`.
 * @param {{status: string, path: string}[]} changes
 * @param {{listTests?: (dir: string) => string[], mode?: "related" | "direct", maxFiles?: number}} options
 */
export function planTests(changes, { listTests = () => [], mode = "related", maxFiles = DEFAULTS.maxRelatedFiles } = {}) {
  const causes = []
  const live = changes.filter((change) => change.status !== "D")
  if (live.some((change) => isGlobalTrigger(change.path))) causes.push("global-change")
  let direct = mode === "direct"
  if (changes.length > maxFiles) {
    causes.push("too-broad")
    direct = true
  }

  const args = new Set()
  const projects = new Set()
  const add = (path, names) => {
    args.add(path)
    for (const name of names) projects.add(name)
  }

  for (const { path } of live) {
    const ws = workspaceOf(path)
    if (!ws || isGlobalTrigger(path)) continue
    const own = WORKSPACE_PROJECTS[ws]
    if (TEST_FILE.test(path)) {
      add(path, own)
      continue
    }
    if (direct) continue
    if (IMPORTABLE.test(path)) {
      if (path.startsWith("shared/src/") && /\.tsx?$/.test(path)) {
        add(path, SHARED_CONSUMERS)
        add(path.replace(/^shared\/src\//, "shared/dist/src/").replace(/\.tsx?$/, ".js"), SHARED_CONSUMERS)
      } else {
        add(path, own)
      }
      continue
    }
    const snapshot = path.match(/^(.+)\/__snapshots__\/([^/]+)\.snap$/)
    if (snapshot) {
      add(`${snapshot[1]}/${snapshot[2]}`, own)
      continue
    }
    const dirs = ws === ".claude/hooks" ? [dirname(path), ".claude/hooks/tests"] : [dirname(path)]
    for (const dir of dirs) for (const test of listTests(dir)) add(test, own)
  }

  return { args: [...args].sort(), projects: [...projects].sort(), causes }
}

/**
 * Ouvre un nouveau cycle de blocages ou prolonge le courant. Ni `stop_hook_active` (valeur après un appel d'outil en
 * continuation non établie) ni `prompt_id` (supposé changer à chaque message de l'utilisateur) ne sont sondés sur `Stop` :
 * le cycle se rouvre aussi dès qu'un verdict a laissé passer la session.
 */
export function nextCycle(cycle, { promptId, stopHookActive, now }) {
  if (cycle && stopHookActive === true) return cycle
  if (cycle) {
    const newPrompt = Boolean(promptId) && promptId !== cycle.promptId
    const stillRed = ["red", "released"].includes(cycle.lastVerdict)
    if (!newPrompt && stillRed) return cycle
  }
  return { promptId: promptId ?? null, blocks: 0, openedAt: now, lastVerdict: null }
}

export function countWindow(blocks, now, windowMs = DEFAULTS.windowMs) {
  return blocks.filter((at) => now - at < windowMs).length
}

const CAUSES = {
  "deps-missing": () => "node_modules absent : lance `yarn install` ; lint, typecheck et tests non lancés",
  "deps-stale": (detail) => `node_modules périmé (${detail}) : lance \`yarn install\` puis termine à nouveau ; lint, typecheck et tests non lancés`,
  "node-mismatch": (detail) => `${detail} : vérifications lancées quand même, résultat à confirmer par la CI`,
  "biome-missing": () => "Biome introuvable dans node_modules : format et lint non lancés",
  "tsc-missing": () => "tsc introuvable dans node_modules : typecheck non lancé",
  "vitest-missing": () => "Vitest introuvable dans node_modules : tests non lancés",
  "no-db-isolation": () => `isolation des bases de test absente (${DB_ISOLATION_MARKER}) : tests server non lancés`,
  "mongo-unreachable": (detail) => `MongoDB injoignable (${detail}) : tests server non lancés`,
  "global-change": () => "configuration globale modifiée (package.json, yarn.lock, tsconfig, setup des tests) : la suite complète tourne en CI, pas ici",
  "too-broad": (detail) => `${detail} fichiers modifiés : seuls les fichiers de test modifiés sont lancés`,
  "tests-off": () => "tests désactivés par LBA_HOOKS_TESTS=off",
  "tests-timeout": (detail) => `délai dépassé pendant ${detail} : résultat inconnu`,
  busy: () => "trop de runs de tests en cours sur la machine : tests non lancés",
  "no-baseline": () => "aucune référence (ni vert, ni base de session, ni merge-base) : seuls les changements par rapport à HEAD sont vérifiés",
  "tool-error": (detail) => `outil en échec : ${detail}`,
}

export function describeCause({ id, detail }) {
  const describe = CAUSES[id]
  return describe ? describe(detail ?? "") : `${id}${detail ? ` : ${detail}` : ""}`
}

const plural = (n, word) => `${n.toLocaleString("fr-FR")} ${word}${n > 1 ? "s" : ""}`

export function coverageText(coverage) {
  const parts = []
  parts.push(coverage.lintFiles == null ? "lint non lancé" : `lint ${plural(coverage.lintFiles, "fichier")}`)
  if (coverage.typecheck === true) parts.push("typecheck 3 projets")
  else if (coverage.typecheck === false) parts.push("typecheck non lancé")
  if (coverage.tests == null) parts.push("tests non lancés")
  else if (coverage.tests.files === 0) parts.push("tests : aucun fichier lié")
  else parts.push(`tests ${plural(coverage.tests.files, "fichier")} sur ${coverage.tests.projects.join(", ")}`)
  parts.push(`Node ${coverage.node}`)
  return parts.join(", ")
}

function causesBlock(causes) {
  return causes.map((cause) => `- ${cause.id} : ${describeCause(cause)}`).join("\n")
}

function redMessage(result, { blocks, maxBlocks }) {
  const lines = [`${PREFIX} Vérification de fin de tour : rouge (${result.failed.join(", ")}).`, result.report.trim()]
  if (result.causes.length) lines.push("Limites de cette vérification :", causesBlock(result.causes))
  lines.push(
    "Corrige ces erreurs puis termine à nouveau. Ne modifie pas un test sain pour le faire passer ; si une erreur ne vient pas de tes changements, dis-le dans ta réponse au lieu de la corriger.",
    `Couverture : ${coverageText(result.coverage)}`
  )
  if (result.rerun) lines.push(`Relancer : ${result.rerun}`)
  if (result.log) lines.push(`Journal : ${result.log}`)
  lines.push(`(blocage ${blocks} sur ${maxBlocks} de ce cycle)`)
  return lines.join("\n")
}

function releasedMessage(report, reason, log) {
  const head = (report ?? "").trim().split("\n").slice(0, 6).join("\n")
  return [`${PREFIX} Toujours rouge, garde relâchée (${reason}) : la session rend la main sans que ce soit corrigé.`, head, log ? `Journal : ${log}` : null]
    .filter(Boolean)
    .join("\n")
}

function informationMessage(newCauses, coverage) {
  return [
    `${PREFIX} INFORMATION : vérification incomplète, rien à corriger dans le code pour ça.`,
    causesBlock(newCauses),
    `Couverture : ${coverageText(coverage)}`,
    "Mentionne ces limites dans ta réponse finale, puis termine.",
  ].join("\n")
}

const systemMessage = (text) => JSON.stringify({ systemMessage: text })

/** Joint un avis pour l'utilisateur au canal que lit Claude Code pour ce code de sortie : stdout JSON en 0, stderr sinon. */
export function attachNotice(result, notice) {
  if (!notice) return result
  if (result.exit === 0) return { ...result, stdout: systemMessage([result.stdout ? JSON.parse(result.stdout).systemMessage : null, notice].filter(Boolean).join("\n")) }
  return { ...result, stderr: [result.stderr, notice].filter(Boolean).join("\n") }
}

/**
 * Verdict d'une vérification qui vient de tourner.
 * @returns {{verdict: string, exit: number, stderr?: string, stdout?: string, notify: string[], block: boolean}}
 */
export function decideRun({ result, cycle, windowCount, notified, strict, maxBlocks = DEFAULTS.maxBlocks, maxBlocksPerWindow = DEFAULTS.maxBlocksPerWindow }) {
  const causeIds = result.causes.map((cause) => cause.id)
  const fresh = result.causes.filter((cause) => !notified.includes(cause.id))
  const red = result.failed.length > 0 || (strict && result.causes.length > 0)

  if (red) {
    const forRed = result.failed.length ? result : { ...result, failed: ["mode strict"], report: "LBA_HOOKS_STRICT=1 : une vérification incomplète compte comme un rouge." }
    if (cycle.blocks >= maxBlocks) {
      return {
        verdict: "released",
        exit: 1,
        stderr: releasedMessage(forRed.report, `plafond de ${maxBlocks} blocages par cycle atteint`, result.log),
        notify: causeIds,
        block: false,
      }
    }
    if (windowCount >= maxBlocksPerWindow) {
      return { verdict: "released", exit: 1, stderr: releasedMessage(forRed.report, `${maxBlocksPerWindow} blocages en 30 minutes`, result.log), notify: causeIds, block: false }
    }
    return { verdict: "red", exit: 2, stderr: redMessage(forRed, { blocks: cycle.blocks + 1, maxBlocks }), notify: causeIds, block: true }
  }

  if (result.causes.length) {
    if (fresh.length) return { verdict: "degraded", exit: 2, stderr: informationMessage(fresh, result.coverage), notify: causeIds, block: false }
    return {
      verdict: "degraded",
      exit: 0,
      stdout: systemMessage(`${PREFIX} Vérifié avec limites (${causeIds.join(", ")}) : ${coverageText(result.coverage)}`),
      notify: [],
      block: false,
    }
  }

  return { verdict: "green", exit: 0, stdout: systemMessage(`${PREFIX} Vert : ${coverageText(result.coverage)}`), notify: [], block: false }
}

/**
 * Verdict quand l'arbre n'a pas changé depuis le dernier run : aucun outil relancé, un rouge déjà bloqué est relâché.
 */
export function decideCached({ last, notified }) {
  const causes = last.causes ?? []
  switch (last.verdict) {
    case "red":
    case "released":
      return {
        verdict: "released",
        exit: 1,
        stderr: releasedMessage(last.report, last.verdict === "red" ? "arbre inchangé depuis le dernier blocage" : "déjà relâché, arbre inchangé", last.log),
        notify: [],
        block: false,
      }
    case "degraded": {
      const fresh = causes.filter((cause) => !notified.includes(cause.id))
      if (fresh.length) return { verdict: "degraded", exit: 2, stderr: informationMessage(fresh, last.coverage), notify: fresh.map((cause) => cause.id), block: false }
      return {
        verdict: "degraded",
        exit: 0,
        stdout: systemMessage(`${PREFIX} Vérifié avec limites (${causes.map((cause) => cause.id).join(", ")}) : ${coverageText(last.coverage)}`),
        notify: [],
        block: false,
      }
    }
    default:
      return { verdict: last.verdict, exit: 0, notify: [], block: false }
  }
}

/**
 * Renvoi au modèle des erreurs Biome d'une édition (15 diagnostics et 4 Ko au plus).
 */
export function formatEditLint(rel, diagnostics, errorCount) {
  const lines = [`${PREFIX} Biome : ${plural(errorCount, "erreur")} dans ${rel} (état du fichier après cette édition)`]
  let size = lines[0].length
  const shown = diagnostics.filter((diagnostic) => diagnostic.severity === "error").slice(0, 15)
  for (const diagnostic of shown) {
    const line = formatDiagnostic(diagnostic)
    if (size + line.length > 4000) break
    lines.push(line)
    size += line.length + 1
  }
  if (errorCount > lines.length - 1) lines.push(`… ${errorCount - (lines.length - 1)} autre(s)`)
  lines.push("Corrige-les dans ce fichier. Si une édition déjà prévue les résout, enchaîne sans rien contourner.")
  lines.push("Formatage, tri des imports et règles typées sont vérifiés en fin de tour.")
  return lines.join("\n")
}

export function formatDiagnostic({ category, message, location }) {
  const where = location?.path ? `${location.path}${location.start?.line ? `:${location.start.line}:${location.start.column}` : ""}` : "?"
  return `${where} ${category ?? "?"} ${String(message ?? "").split("\n")[0]}`
}
