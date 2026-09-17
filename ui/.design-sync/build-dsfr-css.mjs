// Build a single, self-contained DSFR stylesheet for the design-sync bundle.
//
// react-dsfr splits its CSS: `dsfr.main.min.css` is the COMPLETE component
// stylesheet (tokens, Marianne @font-face, all component modules) — NOT
// `dsfr.min.css`, which is a stripped core. The `fr-icon-*` mask definitions
// live separately in `utility/icons/icons.min.css`. Both reference SVG icons
// via url(). Rendered
// designs on claude.ai/design get only the styles.css @import closure under a
// strict CSP, so every icon url() must be inlined as a data-URI (relative
// url(icons/...) would 404 there and in the preview cards).
//
// This concatenates core + icon CSS and inlines all svg/png url()s as
// data-URIs, resolving each file relative to ITS OWN source dir. Font url()s
// (woff/woff2) are left as bare `fonts/<file>` and the woff2s are copied next
// to the output, so the converter's @font-face extractor copies them to fonts/.
//
//   node .design-sync/build-dsfr-css.mjs
//
// Re-run after bumping @codegouvfr/react-dsfr. Output: ds-src/dsfr/dsfr-complete.css

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// Anchor every path on this script's location, NOT the cwd, so the script works
// whatever directory it's launched from.
const HERE = dirname(fileURLToPath(import.meta.url)) // <repo>/ui/.design-sync
// Walk up from HERE to the node_modules holding react-dsfr (monorepo-hoisted).
function findDsfr() {
  for (let d = HERE; ; d = dirname(d)) {
    const p = join(d, "node_modules", "@codegouvfr", "react-dsfr", "dsfr")
    if (existsSync(p)) return p
    if (dirname(d) === d) throw new Error("@codegouvfr/react-dsfr introuvable dans node_modules — lancer `yarn install`")
  }
}
const DSFR = findDsfr()
const OUT_DIR = join(HERE, "ds-src", "dsfr")
const OUT = join(OUT_DIR, "dsfr-complete.css")

const MIME = { svg: "image/svg+xml", png: "image/png" }

// Inline svg/png url()s in `css` as base64 data-URIs, resolving each relative to
// `baseDir`. Leave font (woff/woff2) and remote/data url()s untouched.
// Deduplicated across occurrences (~69 unique SVG for ~209 refs) so each file is
// read/encoded once — base64 (not url-encoding) keeps the output byte-stable so
// re-runs don't churn the downstream verification anchor.
function inlineAssets(css, baseDir, cache) {
  let inlined = 0,
    missing = 0
  const out = css.replace(/url\(\s*(['"]?)([^'")]+?\.(svg|png))\1\s*\)/g, (m, _q, rel, ext) => {
    if (rel.startsWith("data:") || rel.startsWith("http")) return m
    const key = resolve(baseDir, rel)
    if (!cache.has(key)) {
      try {
        cache.set(key, `data:${MIME[ext]};base64,${readFileSync(key).toString("base64")}`)
      } catch {
        cache.set(key, null)
      }
    }
    const uri = cache.get(key)
    if (uri == null) {
      missing++
      return m
    }
    inlined++
    return `url("${uri}")`
  })
  return { out, inlined, missing }
}

mkdirSync(OUT_DIR, { recursive: true })

// Ensure fonts sit next to the output css (core references fonts/Marianne-*).
// Only the font files themselves — skip DSFR's fonts/index.css (unused here).
mkdirSync(join(OUT_DIR, "fonts"), { recursive: true })
for (const f of readdirSync(join(DSFR, "fonts"))) if (/\.(woff2?|ttf|otf)$/i.test(f)) cpSync(join(DSFR, "fonts", f), join(OUT_DIR, "fonts", f))

// dsfr.main.min.css is the COMPLETE component stylesheet (toggle, segmented,
// pagination, download, …). dsfr.min.css is a stripped core that omits many
// component modules — do not use it. fr-icon-* utility classes (for iconId)
// live separately in utility/icons/icons.min.css.
const parts = [
  { file: join(DSFR, "dsfr.main.min.css"), base: DSFR, label: "core" },
  { file: join(DSFR, "utility/icons/icons.min.css"), base: join(DSFR, "utility/icons"), label: "icons" },
]

let combined = ""
let totalMissing = 0
const assetCache = new Map() // rel-path → data-URI (shared across parts, deduped)
for (const p of parts) {
  const { out, inlined, missing } = inlineAssets(readFileSync(p.file, "utf8"), p.base, assetCache)
  combined += `\n/* ==== dsfr ${p.label} ==== */\n` + out
  totalMissing += missing
  console.error(`  ${p.label}: inlined ${inlined} asset(s)${missing ? `, ${missing} MISSING` : ""}`)
}

// The whole point is a self-contained stylesheet: a missing asset leaves a bare
// url(...) that will 404 under claude.ai/design's CSP. Fail loudly rather than
// emit a partially-broken CSS.
if (totalMissing > 0) {
  console.error(`✗ ${totalMissing} asset(s) introuvable(s) — CSS non self-contained, abandon`)
  process.exit(1)
}

writeFileSync(OUT, combined)
console.error(`wrote ${OUT} (${(combined.length / 1024).toFixed(0)} KB)`)
