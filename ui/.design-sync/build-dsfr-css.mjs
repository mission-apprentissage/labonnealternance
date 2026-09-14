// Build a single, self-contained DSFR stylesheet for the design-sync bundle.
//
// react-dsfr splits its CSS: `dsfr.min.css` is the core (components, tokens,
// Marianne @font-face) while the `fr-icon-*` mask definitions live in
// `utility/icons/icons.min.css`. Both reference SVG icons via url(). Rendered
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

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const DSFR = resolve("../node_modules/@codegouvfr/react-dsfr/dsfr")
const OUT_DIR = resolve(".design-sync/ds-src/dsfr")
const OUT = join(OUT_DIR, "dsfr-complete.css")

const MIME = { svg: "image/svg+xml", png: "image/png" }

// Inline svg/png url()s in `css`, resolving each relative to `baseDir`.
// Leave font (woff/woff2) and remote/data url()s untouched.
function inlineAssets(css, baseDir) {
  let inlined = 0,
    missing = 0
  const out = css.replace(/url\(\s*(['"]?)([^'")]+?\.(svg|png))\1\s*\)/g, (m, _q, rel, ext) => {
    if (rel.startsWith("data:") || rel.startsWith("http")) return m
    try {
      const buf = readFileSync(resolve(baseDir, rel))
      inlined++
      return `url("data:${MIME[ext]};base64,${buf.toString("base64")}")`
    } catch {
      missing++
      return m
    }
  })
  return { out, inlined, missing }
}

mkdirSync(OUT_DIR, { recursive: true })

// Ensure fonts sit next to the output css (core references fonts/Marianne-*).
mkdirSync(join(OUT_DIR, "fonts"), { recursive: true })
for (const f of readdirSync(join(DSFR, "fonts"))) cpSync(join(DSFR, "fonts", f), join(OUT_DIR, "fonts", f))

// dsfr.main.min.css is the COMPLETE component stylesheet (toggle, segmented,
// pagination, download, …). dsfr.min.css is a stripped core that omits many
// component modules — do not use it. fr-icon-* utility classes (for iconId)
// live separately in utility/icons/icons.min.css.
const parts = [
  { file: join(DSFR, "dsfr.main.min.css"), base: DSFR, label: "core" },
  { file: join(DSFR, "utility/icons/icons.min.css"), base: join(DSFR, "utility/icons"), label: "icons" },
]

let combined = ""
for (const p of parts) {
  const { out, inlined, missing } = inlineAssets(readFileSync(p.file, "utf8"), p.base)
  combined += `\n/* ==== dsfr ${p.label} ==== */\n` + out
  console.error(`  ${p.label}: inlined ${inlined} asset(s)${missing ? `, ${missing} missing` : ""}`)
}

writeFileSync(OUT, combined)
console.error(`wrote ${OUT} (${(combined.length / 1024).toFixed(0)} KB)`)
