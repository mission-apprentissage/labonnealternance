// Solution 2 : précalcule l'emprise des entités supra-communales une fois pour toutes.
// L'API ne renvoie pas de bbox ; on la dérive de `returntruegeometry` au build,
// pour ne plus jamais transporter 46 Ko à 416 Ko de contour à l'exécution.
//
//   node tools/geo-781/build-bbox.mjs > tools/geo-781/admin-areas-bbox.json
//
// Les écarts (code renvoyé ≠ code attendu, entité introuvable) partent sur stderr
// et font sortir en code 1 : une génération partielle ne doit pas passer pour un succès.

import { bboxOf, coveringRadius, trueGeometry } from "./lib.mjs"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function listOf(kind) {
  const res = await fetch(`https://geo.api.gouv.fr/${kind}?fields=nom,code`)
  if (!res.ok) throw new Error(`listing ${kind} : ${res.status}`)
  return res.json()
}

const [departements, regions] = await Promise.all([listOf("departements"), listOf("regions")])
const wanted = [...regions.map((r) => ({ kind: "région", ...r })), ...departements.map((d) => ({ kind: "département", ...d }))]

const areas = []
const problems = []

for (const entity of wanted) {
  try {
    const geometry = await trueGeometry(entity.kind, entity.nom)
    if (!geometry) {
      problems.push(`${entity.kind} ${entity.code} ${entity.nom} : aucun contour`)
      continue
    }
    const bbox = bboxOf(geometry)
    const center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
    areas.push({
      kind: entity.kind === "région" ? "region" : "departement",
      code: entity.code,
      label: entity.nom,
      bbox: bbox.map((n) => Math.round(n * 1e5) / 1e5),
      covering_radius_km: Math.round(coveringRadius(center, geometry)),
    })
  } catch (err) {
    problems.push(`${entity.kind} ${entity.code} ${entity.nom} : ${err.message}`)
  }
  await sleep(120)
}

process.stdout.write(JSON.stringify({ generated_at: new Date().toISOString(), source: "data.geopf.fr geocodage/search returntruegeometry", areas }, null, 2) + "\n")

if (problems.length) {
  console.error(`\n${problems.length} entité(s) manquante(s) sur ${wanted.length} :`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.error(`${areas.length} entités générées, aucun écart.`)
