/**
 * POC PurgeCSS — supprime les règles DSFR inutilisées des chunks CSS après le build Next.
 *
 * Contexte : react-dsfr injecte l'intégralité de dsfr.min.css (~737 ko bruts / ~100 ko gzip),
 * dont ~87 % est inutilisé (cf. https://github.com/codegouvfr/react-dsfr/issues/304).
 * Ce script réécrit en place les CSS de .next/static/chunks en ne gardant que les
 * sélecteurs référencés dans les bundles JS (client + serveur) et les sources.
 *
 * Précautions issues du thread #304 :
 * - le JS du DSFR ajoute des attributs data-fr-js-* au runtime → safelist "greedy"
 * - certaines classes (fr-collapse, fr-menu, états des modales/tableaux…) sont
 *   ajoutées dynamiquement → safelist par préfixe de composant
 * - les variables CSS ne sont jamais purgées (comportement par défaut de PurgeCSS)
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"
import { PurgeCSS } from "purgecss"

const uiDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const nextDir = path.join(uiDir, ".next")
const cssDir = path.join(nextDir, "static", "chunks")

const content = [
  // Bundles client : contiennent toutes les classes utilisées par les composants React
  path.join(nextDir, "static", "chunks", "**", "*.js"),
  // Rendu serveur (RSC/HTML prérendu) : classes émises côté serveur uniquement
  path.join(nextDir, "server", "**", "*.{js,html,rsc}"),
  // Sources : filet de sécurité pour les classes construites via fr.cx(...)
  path.join(uiDir, "app", "**", "*.{ts,tsx}"),
  path.join(uiDir, "components", "**", "*.{ts,tsx}"),
]

// Composants dont le DSFR ajoute/retire des classes au runtime (menu mobile,
// modales, accordéons, tableaux, onglets…) : on garde tout leur CSS.
const DYNAMIC_COMPONENT_PREFIXES = [
  /^fr-collapse/,
  /^fr-menu/,
  /^fr-modal/,
  /^fr-nav/,
  /^fr-tabs/,
  /^fr-table/,
  /^fr-accordion/,
  /^fr-pagination/,
  /^fr-tooltip/,
  /^fr-toggle/,
  /^fr-checkbox/,
  /^fr-radio/,
  /^fr-range/,
  /^fr-select/,
  /^fr-header/,
  /^fr-footer/,
  /^fr-sidemenu/,
  /^fr-consent/,
  /^fr-transcription/,
  /^fr-translate/,
  /^fr-artwork/,
  // Icônes : déjà réduites par `react-dsfr update-icons`, on n'y retouche pas
  /^fr-icon-/,
  /^fr-fi-/,
]

async function main() {
  const allCssFiles = (await fs.readdir(cssDir)).filter((f) => f.endsWith(".css")).map((f) => path.join(cssDir, f))

  // On ne purge QUE le chunk DSFR : les CSS tiers (react-dates, notion…) utilisent
  // des classes composées au runtime qui échappent au scan statique.
  const cssFiles = []
  for (const file of allCssFiles) {
    const css = await fs.readFile(file, "utf8")
    const dsfrRuleCount = (css.match(/\.fr-[a-z]/g) || []).length
    if (dsfrRuleCount > 500) {
      cssFiles.push(file)
    }
  }

  if (cssFiles.length === 0) {
    console.error(`purge-dsfr-css: aucun chunk DSFR trouvé dans ${cssDir} — lancer après \`next build\``)
    process.exit(1)
  }

  const before = new Map()
  for (const file of cssFiles) {
    before.set(file, await fs.readFile(file, "utf8"))
  }

  const results = await new PurgeCSS().purge({
    content,
    css: cssFiles,
    defaultExtractor: (c) => c.match(/[\w-/:%.]+(?<!:)/g) || [],
    safelist: {
      standard: ["dark", "light", ...DYNAMIC_COMPONENT_PREFIXES],
      // "greedy" : conserve tout sélecteur dont une partie matche — indispensable
      // pour les attributs data-fr-js-* posés au runtime (bordures de <Table>, etc.)
      greedy: [/data-fr/],
    },
    dynamicAttributes: ["aria-expanded", "aria-selected", "aria-current", "aria-disabled", "aria-hidden", "open", "disabled", "target"],
  })

  const fmt = (n) => `${(n / 1024).toFixed(1)} ko`
  const gz = (s) => gzipSync(Buffer.from(s)).length
  let totalBefore = 0
  let totalAfter = 0
  let totalGzBefore = 0
  let totalGzAfter = 0

  for (const { file, css } of results) {
    const original = before.get(file)
    await fs.writeFile(file, css)
    const [b, a, gb, ga] = [Buffer.byteLength(original), Buffer.byteLength(css), gz(original), gz(css)]
    totalBefore += b
    totalAfter += a
    totalGzBefore += gb
    totalGzAfter += ga
    console.log(`purge-dsfr-css: ${path.basename(file)} ${fmt(b)} → ${fmt(a)} (gzip ${fmt(gb)} → ${fmt(ga)})`)
  }

  console.log(`purge-dsfr-css: TOTAL ${fmt(totalBefore)} → ${fmt(totalAfter)} (gzip ${fmt(totalGzBefore)} → ${fmt(totalGzAfter)})`)
}

await main()
