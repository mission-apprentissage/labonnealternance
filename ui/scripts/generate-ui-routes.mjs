#!/usr/bin/env node
// Génère shared/src/constants/ui-routes.ts à partir de l'arborescence Next de ui/app.
//
// Le back-office des formulaires de feedback doit refuser un chemin de déclenchement qui ne
// correspond à aucune page : la liste doit donc être lisible par le serveur (validation des
// routes admin) autant que par l'UI, d'où un fichier committé dans shared plutôt qu'un calcul
// à la volée. Le test shared/src/constants/ui-routes.test.ts échoue si ce fichier est périmé.

import { readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
export const APP_DIR = path.join(here, "..", "app")
const OUTPUT_FILE = path.join(here, "..", "..", "shared", "src", "constants", "ui-routes.ts")

/** `[id]` -> `:id`, `[...rest]` -> `*`, `(group)` et `@slot` -> segment ignoré dans l'URL */
function toUrlSegment(dirName) {
  if (dirName.startsWith("(") && dirName.endsWith(")")) return null
  if (dirName.startsWith("@")) return null
  const dynamic = dirName.match(/^\[\[?\.{0,3}(.+?)\]?\]$/)
  if (!dynamic) return dirName
  return dirName.startsWith("[...") || dirName.startsWith("[[...") ? "*" : `:${dynamic[1]}`
}

export async function collectRoutePatterns(dir = APP_DIR, segments = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  const routes = []

  if (entries.some((entry) => entry.isFile() && entry.name === "page.tsx")) {
    routes.push(`/${segments.join("/")}`.replace(/\/+$/, "") || "/")
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_") || entry.name === "node_modules") continue
    const urlSegment = toUrlSegment(entry.name)
    routes.push(...(await collectRoutePatterns(path.join(dir, entry.name), urlSegment === null ? segments : [...segments, urlSegment])))
  }

  return routes
}

export async function buildSortedRoutePatterns() {
  return [...new Set(await collectRoutePatterns())].sort()
}

async function main() {
  const routes = await buildSortedRoutePatterns()
  const content = `// Fichier généré par ui/scripts/generate-ui-routes.mjs — ne pas modifier à la main.
// Régénérer avec : yarn generate:ui-routes

/** Tous les chemins de pages du site, segments dynamiques notés \`:param\`. */
export const UI_ROUTE_PATTERNS = [
${routes.map((route) => `  "${route}",`).join("\n")}
] as const
`
  await writeFile(OUTPUT_FILE, content, "utf8")
  console.log(`${routes.length} routes écrites dans ${path.relative(process.cwd(), OUTPUT_FILE)}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
