#!/usr/bin/env node
/**
 * Budget de performance du first-load — issue #5191.
 *
 * Sources de mesure (toutes produites par `next build`, aucune constante dérivée à la main) :
 *  - `.next/diagnostics/route-bundle-stats.json` : écrit sans condition par Next 16
 *    (`writeRouteBundleStats`) → { route, firstLoadUncompressedJsBytes, firstLoadChunkPaths }.
 *  - `.next/server/app/<route>.html` : les feuilles CSS du first-load d'une route prérendue.
 *  - les sourcemaps des chunks : pour asserter l'absence d'un package sur le first-load.
 *
 * Deux classes de sortie, volontairement distinctes :
 *  - dépassement de budget → jugement, assouplissable par `--report-only` ;
 *  - erreur de mesure (fichier absent, sourcemap introuvable, route inconnue) → toujours exit 1.
 * Sinon un run vert serait indiscernable d'un run qui n'a rien mesuré.
 *
 * Usage : node ui/scripts/perf-budget.mjs [--report-only] [--json] [--ui-dir=…] [--config=…] [--out=…]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

/** Erreur de mesure : la CI doit échouer même en `--report-only`. */
export class MeasureError extends Error {
  constructor(message) {
    super(message)
    this.name = "MeasureError"
  }
}

const DEFAULT_UI_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export function readJsonFile(filePath, what) {
  if (!existsSync(filePath)) {
    throw new MeasureError(`${what} introuvable : ${filePath}`)
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf8"))
  } catch (error) {
    throw new MeasureError(`${what} illisible (${filePath}) : ${error.message}`)
  }
}

export function readRouteStats(uiDir) {
  const statsPath = path.join(uiDir, ".next", "diagnostics", "route-bundle-stats.json")
  const stats = readJsonFile(statsPath, "route-bundle-stats.json (produit par `next build` de Next >= 16 ; lancer le build avant ce script)")
  if (!Array.isArray(stats) || stats.length === 0) {
    throw new MeasureError(`route-bundle-stats.json vide ou de forme inattendue : ${statsPath}`)
  }
  return stats
}

export function findRouteEntry(stats, route) {
  const entry = stats.find((item) => item.route === route)
  if (!entry) {
    throw new MeasureError(
      `route « ${route} » absente de route-bundle-stats.json. Routes connues les plus proches : ` +
        `${
          stats
            .map((item) => item.route)
            .filter((known) => known.startsWith(route.slice(0, 4)))
            .slice(0, 5)
            .join(", ") || "aucune"
        }`
    )
  }
  if (!Array.isArray(entry.firstLoadChunkPaths) || entry.firstLoadChunkPaths.length === 0) {
    throw new MeasureError(`route « ${route} » sans firstLoadChunkPaths — format de Next inattendu`)
  }
  return entry
}

export function gzipSize(buffer, level) {
  return gzipSync(buffer, { level }).byteLength
}

/** Somme gzip des chunks JS du first-load. Les chemins du JSON sont relatifs au dossier `ui`. */
export function measureFirstLoadJs(uiDir, entry, level) {
  let total = 0
  for (const relPath of entry.firstLoadChunkPaths) {
    const absPath = path.join(uiDir, relPath)
    if (!existsSync(absPath)) {
      throw new MeasureError(`chunk du first-load de « ${entry.route} » introuvable : ${absPath}`)
    }
    total += gzipSize(readFileSync(absPath), level)
  }
  return total
}

/**
 * Toutes les feuilles CSS référencées par le HTML prérendu, dédoublonnées.
 * On prend aussi les `rel="preload" as="style"` : Next en émet (constaté sur la home) et le
 * navigateur les télécharge au premier chargement, donc elles pèsent dans le first-load.
 */
export function extractCssHrefs(html) {
  const hrefs = []
  for (const match of html.matchAll(/href="(\/_next\/[^"]+?\.css)"/g)) {
    if (!hrefs.includes(match[1])) {
      hrefs.push(match[1])
    }
  }
  return hrefs
}

export function routeHtmlFile(route) {
  return route === "/" ? "index.html" : `${route.replace(/^\//, "")}.html`
}

export function measureFirstLoadCss(uiDir, route, level) {
  const htmlPath = path.join(uiDir, ".next", "server", "app", routeHtmlFile(route))
  if (!existsSync(htmlPath)) {
    throw new MeasureError(
      `HTML prérendu de « ${route} » introuvable : ${htmlPath}. La route n'est probablement pas ` +
        `prérendue — retirer « firstLoadCssGzip » de cette route dans le fichier de budgets.`
    )
  }
  const hrefs = extractCssHrefs(readFileSync(htmlPath, "utf8"))
  if (hrefs.length === 0) {
    throw new MeasureError(`aucune feuille CSS trouvée dans ${htmlPath} — format de Next inattendu`)
  }
  let total = 0
  for (const href of hrefs) {
    const absPath = path.join(uiDir, ".next", href.replace(/^\/_next\//, ""))
    if (!existsSync(absPath)) {
      throw new MeasureError(`feuille CSS du first-load de « ${route} » introuvable : ${absPath}`)
    }
    total += gzipSize(readFileSync(absPath), level)
  }
  return { bytes: total, count: hrefs.length }
}

/**
 * Turbopack nomme la sourcemap avec un hash différent de celui du chunk
 * (`0u6odem8truz3.js` → `0p4wlissmmxc7.js.map`) : `chunk + ".map"` ne résout rien et ferait
 * conclure à tort qu'un package est absent. On lit donc le commentaire `sourceMappingURL`.
 */
export function resolveSourceMapPath(chunkPath) {
  const content = readFileSync(chunkPath, "utf8")
  const matches = [...content.matchAll(/\/\/#\s*sourceMappingURL=(\S+)/g)]
  if (matches.length === 0) {
    throw new MeasureError(
      `aucun commentaire sourceMappingURL dans ${chunkPath} — impossible d'asserter le contenu du ` + `chunk. Vérifier que « productionBrowserSourceMaps » est actif.`
    )
  }
  const url = matches[matches.length - 1][1]
  if (url.startsWith("data:")) {
    throw new MeasureError(`sourcemap inline (data:) non gérée pour ${chunkPath}`)
  }
  const mapPath = path.resolve(path.dirname(chunkPath), url)
  if (!existsSync(mapPath)) {
    throw new MeasureError(`sourcemap déclarée par ${chunkPath} introuvable : ${mapPath}`)
  }
  return mapPath
}

/**
 * Les sourcemaps de Turbopack sont indexées : `sources` est vide à la racine et le contenu réel
 * vit dans `sections[].map.sources`. Lire `map.sources` seul renvoie [] et donc un faux « absent ».
 *
 * Une map peut légitimement n'avoir aucune source (chunk de code généré : runtime Turbopack,
 * polyfills, injection de debugId) — c'est une mesure valide, pas une panne. En revanche une forme
 * non reconnue (ni « sources » ni « sections ») est une panne : on échoue.
 */
export function readSourceMapSources(mapPath) {
  const map = readJsonFile(mapPath, "sourcemap")
  if (!Array.isArray(map.sources) && !Array.isArray(map.sections)) {
    throw new MeasureError(
      `sourcemap de forme non reconnue : ${mapPath}. Ni « sources » ni « sections » — le format de ` +
        `sortie du bundler a probablement changé, l'assertion d'absence de package serait un faux négatif.`
    )
  }
  const sources = []
  if (Array.isArray(map.sources)) {
    sources.push(...map.sources)
  }
  if (Array.isArray(map.sections)) {
    for (const section of map.sections) {
      if (Array.isArray(section?.map?.sources)) {
        sources.push(...section.map.sources)
      }
    }
  }
  return sources
}

/**
 * Un package est présent si un chemin source contient `node_modules/<pkg>/` (préfixe exact, pour
 * qu'un homonyme comme `libphonenumber-js-mock` ne déclenche rien).
 *
 * Garde-fou d'observabilité : si aucun chunk de la route ne remonte la moindre source, la méthode
 * est en panne (format changé, sourcemaps désactivées) et répondrait « package absent » sur tout.
 * Le décompte des chunks réellement analysés est remonté dans le rapport.
 */
export function findForbiddenPackages(uiDir, chunkPaths, packages) {
  const hits = new Map()
  const jsChunks = chunkPaths.filter((relPath) => relPath.endsWith(".js"))
  let chunksWithSources = 0
  let sourceCount = 0

  for (const relPath of jsChunks) {
    const absPath = path.join(uiDir, relPath)
    if (!existsSync(absPath)) {
      throw new MeasureError(`chunk introuvable pour l'analyse des sources : ${absPath}`)
    }
    const sources = readSourceMapSources(resolveSourceMapPath(absPath))
    if (sources.length > 0) {
      chunksWithSources += 1
      sourceCount += sources.length
    }
    for (const pkg of packages) {
      if (sources.some((source) => source.includes(`node_modules/${pkg}/`))) {
        const chunks = hits.get(pkg) ?? []
        chunks.push(relPath)
        hits.set(pkg, chunks)
      }
    }
  }

  if (jsChunks.length > 0 && sourceCount === 0) {
    throw new MeasureError(
      `aucune source exploitable sur les ${jsChunks.length} chunks analysés : l'assertion d'absence ` +
        `de package n'a rien pu vérifier. Cause probable : sourcemaps désactivées ou format de map changé.`
    )
  }

  return { hits, chunksAnalysed: jsChunks.length, chunksWithSources, sourceCount }
}

function judge(measured, budget) {
  if (budget === null || budget === undefined) {
    return "unset"
  }
  return measured > budget ? "over" : "ok"
}

export function evaluate({ uiDir, config }) {
  const level = config.gzipLevel ?? 9
  const stats = readRouteStats(uiDir)
  const rows = []
  const forbidden = []
  const scans = []

  for (const [route, budgets] of Object.entries(config.routes ?? {})) {
    const entry = findRouteEntry(stats, route)
    const jsGzip = measureFirstLoadJs(uiDir, entry, level)
    rows.push({
      label: `JS first-load ${route}`,
      route,
      kind: "js",
      measured: jsGzip,
      budget: budgets.firstLoadJsGzip,
      status: judge(jsGzip, budgets.firstLoadJsGzip),
      detail: `${entry.firstLoadChunkPaths.length} chunks`,
    })

    if ("firstLoadCssGzip" in budgets) {
      const css = measureFirstLoadCss(uiDir, route, level)
      rows.push({
        label: `CSS first-load ${route}`,
        route,
        kind: "css",
        measured: css.bytes,
        budget: budgets.firstLoadCssGzip,
        status: judge(css.bytes, budgets.firstLoadCssGzip),
        detail: `${css.count} feuilles`,
      })
    }

    const packages = config.forbiddenOnFirstLoad?.[route] ?? []
    if (packages.length > 0) {
      const { hits, chunksAnalysed, chunksWithSources, sourceCount } = findForbiddenPackages(uiDir, entry.firstLoadChunkPaths, packages)
      for (const pkg of packages) {
        forbidden.push({ route, pkg, chunks: hits.get(pkg) ?? [] })
      }
      scans.push({ route, chunksAnalysed, chunksWithSources, sourceCount })
    }
  }

  const worst = stats.reduce((max, item) => (item.firstLoadUncompressedJsBytes > max.firstLoadUncompressedJsBytes ? item : max))
  rows.push({
    label: "JS first-load max (toutes routes, brut)",
    route: worst.route,
    kind: "global",
    measured: worst.firstLoadUncompressedJsBytes,
    budget: config.globalMaxFirstLoadJsRaw,
    status: judge(worst.firstLoadUncompressedJsBytes, config.globalMaxFirstLoadJsRaw),
    detail: worst.route,
  })

  return {
    gzipLevel: level,
    routeCount: stats.length,
    rows,
    forbidden,
    scans,
    violations: [
      ...rows.filter((row) => row.status === "over").map((row) => row.label),
      ...forbidden.filter((item) => item.chunks.length > 0).map((item) => `${item.pkg} sur ${item.route}`),
    ],
    unset: rows.filter((row) => row.status === "unset").map((row) => row.label),
  }
}

export function formatKo(bytes) {
  return `${(bytes / 1024).toFixed(1).replace(".", ",")} ko`
}

const STATUS_ICON = { ok: "✅", over: "⚠️", unset: "❔" }

export function formatMarkdown(report, { configPath, reportOnly }) {
  const lines = ["### 📦 Budget de performance du first-load", "", `| | Métrique | Mesure | Budget | Marge |`, `|---|---|---|---|---|`]
  for (const row of report.rows) {
    const budget = row.budget === null || row.budget === undefined ? "—" : formatKo(row.budget)
    const margin = row.budget === null || row.budget === undefined ? "—" : `${(((row.budget - row.measured) / row.budget) * 100).toFixed(1).replace(".", ",")} %`
    lines.push(`| ${STATUS_ICON[row.status]} | ${row.label} | ${formatKo(row.measured)} | ${budget} | ${margin} |`)
  }
  const scanFootnote = report.scans.map((scan) => `${scan.route} : ${scan.chunksWithSources}/${scan.chunksAnalysed} chunks tracés (${scan.sourceCount} sources)`).join(" · ")
  lines.push("", `<sub>gzip niveau ${report.gzipLevel} · ${report.routeCount} routes analysées${scanFootnote ? ` · ${scanFootnote}` : ""}</sub>`)

  if (report.forbidden.length > 0) {
    lines.push("", "**Packages interdits sur le first-load**", "")
    for (const item of report.forbidden) {
      lines.push(
        item.chunks.length === 0
          ? `- ✅ \`${item.pkg}\` absent de ${item.route}`
          : `- ⚠️ \`${item.pkg}\` présent sur ${item.route} — chunks : ${item.chunks.map((chunk) => `\`${path.basename(chunk)}\``).join(", ")}`
      )
    }
  }

  if (report.unset.length > 0) {
    lines.push(
      "",
      `> ❔ **${report.unset.length} budget(s) non renseigné(s)** dans \`${configPath}\` : rien n'est ` +
        `contrôlé pour ces lignes. Reporter les mesures ci-dessus (+ marge) pour activer le garde-fou.`
    )
  }

  if (report.violations.length > 0) {
    lines.push(
      "",
      reportOnly
        ? `> ⚠️ **${report.violations.length} dépassement(s)** — mode informatif, la CI ne bloque pas. ` +
            `Si la hausse est assumée, relever le seuil dans \`${configPath}\` et le justifier en description de PR.`
        : `> ⛔ **${report.violations.length} dépassement(s)** — job en échec.`
    )
  }

  return lines.join("\n")
}

function budgetFailureMessage(report, configPath) {
  return [
    `Budget de performance dépassé : ${report.violations.join(", ")}.`,
    "",
    "Deux issues :",
    "  1. réduire le bundle (import ciblé plutôt qu'un barrel, composant DSFR en moins, lazy-load) ;",
    `  2. si la hausse est assumée, mettre à jour le seuil dans ${configPath} avec la mesure`,
    "     affichée ci-dessus, et justifier la hausse en description de PR.",
    "",
    `Clés concernées : ${
      report.rows
        .filter((row) => row.status === "over")
        .map((row) => (row.kind === "global" ? "globalMaxFirstLoadJsRaw" : `routes["${row.route}"].firstLoad${row.kind === "js" ? "Js" : "Css"}Gzip`))
        .join(", ") || "forbiddenOnFirstLoad"
    }`,
  ].join("\n")
}

export function main(argv = []) {
  const flags = new Set(argv.filter((arg) => !arg.includes("=")))
  const options = Object.fromEntries(argv.filter((arg) => arg.includes("=")).map((arg) => [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)]))
  const reportOnly = flags.has("--report-only")
  const uiDir = path.resolve(options["--ui-dir"] ?? DEFAULT_UI_DIR)
  const configPath = path.resolve(options["--config"] ?? path.join(uiDir, "perf-budget.json"))

  let report
  try {
    report = evaluate({ uiDir, config: readJsonFile(configPath, "fichier de budgets") })
  } catch (error) {
    if (error instanceof MeasureError) {
      // Erreur de mesure : jamais assouplie par --report-only.
      console.error(`❌ mesure impossible — ${error.message}`)
      return 1
    }
    throw error
  }

  const displayConfigPath = path.relative(process.cwd(), configPath) || configPath
  const markdown = formatMarkdown(report, { configPath: displayConfigPath, reportOnly })
  if (flags.has("--json")) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(markdown)
  }
  if (options["--out"]) {
    writeFileSync(options["--out"], `${markdown}\n`)
  }

  if (report.violations.length > 0) {
    console.error(`\n${budgetFailureMessage(report, displayConfigPath)}`)
    if (!reportOnly) {
      return 1
    }
  }
  if (report.unset.length > 0) {
    console.error(`\n⚠️ budget(s) non renseigné(s) : ${report.unset.join(", ")} — aucun contrôle sur ces lignes.`)
    if (!reportOnly) {
      return 1
    }
  }
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)))
}
