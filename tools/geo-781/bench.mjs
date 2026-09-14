// Banc d'essai des 3 solutions d'emprise administrative (issue #781).
//
//   node tools/geo-781/bench.mjs "Bretagne"
//   LBA_MONGODB_URI="mongodb://..." node tools/geo-781/bench.mjs "Nord" --limit 500
//
// Sans LBA_MONGODB_URI (la variable du server/.env) : compare les emprises entre elles.
// Avec : exécute les requêtes sur `search_items` et mesure ce que
// chaque stratégie ramène VRAIMENT, la vérité terrain étant l'appartenance au
// contour officiel (point-in-polygon), pas la stratégie elle-même.

import { areaOf, bboxOf, contains, coveringRadius, resolve, SUPRA_COMMUNAL, trueGeometry } from "./lib.mjs"

const query = process.argv[2]
if (!query) {
  console.error('usage : node tools/geo-781/bench.mjs "<saisie>" [--limit N] [--diff]')
  process.exit(2)
}
const limitArg = process.argv.indexOf("--limit")
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : 1000
const DIFF = process.argv.includes("--diff")

const fmt = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })
const pct = (n) => `${fmt(n * 100, n > 0 && n * 100 < 1 ? 2 : 0)} %`

// ---------------------------------------------------------------- résolution

const candidates = await resolve(query)
if (!candidates.length) {
  console.error(`Aucune entité administrative pour "${query}".`)
  process.exit(1)
}
const area = candidates.find((c) => SUPRA_COMMUNAL.includes(c.kind)) ?? candidates[0]

console.log(`\nSaisie      "${query}"`)
console.log(`Résolue en  ${area.label} (${area.kind}, code ${area.code}, score ${area.score})`)
if (candidates.length > 1) {
  console.log(
    `Autres      ${candidates
      .slice(0, 4)
      .filter((c) => c !== area)
      .map((c) => `${c.label} [${c.kind}]`)
      .join(", ")}`
  )
}

const geometry = await trueGeometry(area.kind, area.label)
if (!geometry) {
  console.error("Contour indisponible, impossible de mesurer.")
  process.exit(1)
}

const bbox = bboxOf(geometry)
const radius = coveringRadius(area.center, geometry)
const realArea = areaOf(geometry)
const bboxArea = areaOf({
  type: "Polygon",
  coordinates: [
    [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[1]],
      [bbox[2], bbox[3]],
      [bbox[0], bbox[3]],
      [bbox[0], bbox[1]],
    ],
  ],
})
const discArea = Math.PI * radius * radius

console.log(`\nEmprises`)
console.log(`  contour officiel   ${fmt(realArea)} km²`)
console.log(`  bbox               ${fmt(bboxArea)} km²   (+${pct(bboxArea / realArea - 1)})`)
console.log(`  disque r=${fmt(radius)} km      ${fmt(discArea)} km²   (+${pct(discArea / realArea - 1)})`)
if (radius > 200) console.log(`  /!\\ rayon ${fmt(radius)} km au-dessus du plafond de 200 km de l'API v3`)

// ---------------------------------------------------------------- stratégies

const strategies = [
  {
    id: "1-rayon (actuel)",
    note: "point + rayon, ce que fait LBA aujourd'hui",
    clause: { geoWithin: { circle: { center: { type: "Point", coordinates: area.center }, radius: Math.round(radius * 1000) }, path: "location" } },
  },
  {
    id: "2-bbox",
    note: "bbox précalculée (4 nombres, aucun contour transporté)",
    clause: {
      geoWithin: { box: { bottomLeft: { type: "Point", coordinates: [bbox[0], bbox[1]] }, topRight: { type: "Point", coordinates: [bbox[2], bbox[3]] } }, path: "location" },
    },
  },
  {
    id: "3-contour",
    note: "contour officiel en $geoWithin.geometry",
    clause: { geoWithin: { geometry, path: "location" } },
  },
  {
    id: "4-code (retenu)",
    note: "equals sur le code indexé à la construction des items",
    clause: { equals: { path: area.kind === "région" ? "region_code" : "departement_code", value: area.code } },
  },
]

const mongoUri = process.env.LBA_MONGODB_URI ?? process.env.MONGODB_URI
if (!mongoUri) {
  console.log(`\nLBA_MONGODB_URI absent : mesure géométrique seulement.`)
  console.log(`Relancer avec LBA_MONGODB_URI (celle de server/.env) pour compter les offres réellement ramenées.\n`)
  for (const s of strategies) console.log(`  ${s.id.padEnd(18)} ${s.note}`)
  console.log()
  process.exit(0)
}

// ------------------------------------------------------- exécution sur la base

const { MongoClient } = await import("mongodb")
const client = new MongoClient(mongoUri)
await client.connect()
const items = client.db().collection("search_items")

async function run(clause) {
  const started = Date.now()
  const docs = await items
    .aggregate([
      { $search: { index: "search_items_index", compound: { must: [{ exists: { path: "location" } }], filter: [clause] } } },
      { $limit: LIMIT },
      { $project: { _id: 0, url_id: 1, type: 1, address: 1, location: 1, departement_code: 1, region_code: 1 } },
    ])
    .toArray()
  return { docs, ms: Date.now() - started }
}

const results = []
for (const s of strategies) {
  try {
    const { docs, ms } = await run(s.clause)
    const inside = docs.filter((d) => d.location && contains(geometry, d.location.coordinates))
    results.push({ ...s, total: docs.length, inside: inside.length, ms, truncated: docs.length === LIMIT, docs })
  } catch (err) {
    results.push({ ...s, error: err.message })
  }
}

const reference = results.find((r) => r.id === "3-contour")

console.log(`\nRésultats sur search_items (limite ${fmt(LIMIT)})\n`)
console.log(`  stratégie          ramenés   dans le périmètre   hors périmètre   rappel    temps`)
for (const r of results) {
  if (r.error) {
    console.log(`  ${r.id.padEnd(18)} ERREUR ${r.error}`)
    continue
  }
  const noise = r.total ? 1 - r.inside / r.total : 0
  const recall = reference?.inside ? r.inside / reference.inside : NaN
  console.log(
    `  ${r.id.padEnd(18)} ${String(r.total).padStart(7)}   ${String(r.inside).padStart(17)}   ${pct(noise).padStart(14)}   ${(Number.isNaN(recall) ? "-" : pct(recall)).padStart(6)}   ${String(r.ms).padStart(5)} ms`
  )
}
for (const r of results) if (r.truncated) console.log(`\n  /!\\ ${r.id} a atteint la limite de ${LIMIT} : relancer avec --limit plus haut pour des chiffres exploitables.`)

const codes = results.find((r) => r.id.startsWith("4-code"))
if (codes && !codes.error && codes.total === 0) {
  console.log(`\n  /!\\ 4-code ramène 0 : soit les champs departement_code/region_code ne sont pas encore`)
  console.log(`  peuplés (relancer la génération de search_items), soit l'index Atlas Search n'a pas`)
  console.log(`  fini sa reconstruction (db.search_items.aggregate([{ $listSearchIndexes: {} }])).\n`)
}
console.log(`\n  Lecture : "hors périmètre" compare chaque résultat au contour officiel. 4-code doit`)
console.log(`  être à 0 % de bruit et 100 % de rappel par rapport à 3-contour ; un écart signale`)
console.log(`  une commune mal rattachée dans le référentiel ou un CP à cheval non tranché.\n`)

if (DIFF && reference && !reference.error && codes && !codes.error) {
  const key = (d) => `${d.type}:${d.url_id}`
  const byCode = new Map(codes.docs.map((d) => [key(d), d]))
  const byContour = new Map(reference.docs.map((d) => [key(d), d]))
  const missing = reference.docs.filter((d) => !byCode.has(key(d)))
  const intruders = codes.docs.filter((d) => !contains(geometry, d.location.coordinates))
  const show = (d) => `    ${d.type.padEnd(9)} dep=${String(d.departement_code).padEnd(4)} [${d.location.coordinates.map((c) => c.toFixed(4)).join(", ")}]  ${d.address}`

  console.log(`  Dans le contour mais sans le code (${missing.length}) : la source contredit le géopoint, ou le CP est inconnu`)
  for (const d of missing) console.log(show(d))
  console.log(`\n  Avec le code mais hors du contour (${intruders.length}) : géopoint au large du trait de côte, ou CP d'un autre département`)
  for (const d of intruders) console.log(show(d))
  const unknownToContour = intruders.filter((d) => !byContour.has(key(d))).length
  if (unknownToContour !== intruders.length)
    console.log(`\n  (incohérence : ${intruders.length - unknownToContour} intrus sont aussi dans 3-contour, le point-in-polygon local diverge de mongot)`)
  console.log()
}

await client.close()
