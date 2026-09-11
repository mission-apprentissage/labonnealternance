// Briques partagées par bench.mjs et build-bbox.mjs.
// Aucune dépendance au serveur LBA : ce dossier est un banc d'essai jetable (issue #781).

const GEOCODE = "https://data.geopf.fr/geocodage"

/** Catégories de l'index `poi` qui portent une entité supra-communale. */
export const SUPRA_COMMUNAL = ["région", "département", "epci"]

/** Catégories retenues quand on veut aussi la maille communale. */
export const ADMIN_CATEGORIES = [...SUPRA_COMMUNAL, "commune", "arrondissement municipal"]

async function geopf(path, params) {
  const url = `${GEOCODE}/${path}?${new URLSearchParams(params)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} sur ${url}`)
  return res.json()
}

/**
 * Résout une saisie libre en entités administratives.
 * L'index `poi` ne renvoie ni `label` ni `postcode` : on normalise ici ce que
 * l'UI devra normaliser aussi (cf. ui/services/base-adresse.ts).
 */
export async function resolve(query, { limit = 10, categories = ADMIN_CATEGORIES } = {}) {
  const data = await geopf("search", { index: "address,poi", q: query, limit: String(limit) })
  return data.features
    .filter((f) => f.properties._type === "poi")
    .filter((f) => categories.includes(f.properties.category?.[1]))
    .map((f) => ({
      kind: f.properties.category[1],
      // Le code administratif est logé dans `citycode`, pas dans un champ dédié.
      code: f.properties.citycode?.[0] ?? null,
      label: f.properties.toponym,
      center: f.geometry.coordinates,
      score: f.properties.score,
    }))
}

/** Contour officiel d'une entité. Lourd : 46 Ko pour un département, 416 Ko pour la Bretagne. */
export async function trueGeometry(kind, label) {
  const data = await geopf("search", {
    index: "poi",
    category: kind,
    q: label,
    limit: "1",
    returntruegeometry: "true",
  })
  const feature = data.features[0]
  if (!feature) return null
  const raw = feature.properties.truegeometry
  return typeof raw === "string" ? JSON.parse(raw) : raw
}

export function rings(geometry) {
  if (!geometry) return []
  return geometry.type === "Polygon" ? [geometry.coordinates[0]] : geometry.coordinates.map((p) => p[0])
}

export function bboxOf(geometry) {
  const pts = rings(geometry).flat()
  const xs = pts.map((c) => c[0])
  const ys = pts.map((c) => c[1])
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

const R = 6371

export function haversine(a, b) {
  const p1 = (a[1] * Math.PI) / 180
  const p2 = (b[1] * Math.PI) / 180
  const dp = p2 - p1
  const dl = ((b[0] - a[0]) * Math.PI) / 180
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Rayon couvrant toute l'entité depuis son centroïde. C'est ce que coûte un filtre point+rayon. */
export function coveringRadius(center, geometry) {
  const pts = rings(geometry).flat()
  return Math.max(...pts.map((c) => haversine(center, c)))
}

/** Aire sphérique approchée, en km². */
export function areaOf(geometry) {
  return rings(geometry).reduce((total, ring) => {
    let s = 0
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i]
      const [x2, y2] = ring[(i + 1) % ring.length]
      s += (((x2 - x1) * Math.PI) / 180) * (2 + Math.sin((y1 * Math.PI) / 180) + Math.sin((y2 * Math.PI) / 180))
    }
    return total + Math.abs((s * R * R) / 2)
  }, 0)
}

/** Ray casting. Sert à mesurer combien de résultats tombent réellement hors du périmètre. */
export function contains(geometry, point) {
  const [x, y] = point
  let inside = false
  for (const ring of rings(geometry)) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}
