import type { IPointGeometry } from "shared/models/index"

import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Dérivation des codes département et région d'un item de recherche, à partir du référentiel
 * communes déjà en base (`referentiel.communes`, alimenté par l'API Découpage administratif).
 *
 * Pourquoi à la construction et pas à la requête : un filtre `equals` sur un champ `token` est
 * l'opération la moins chère d'Atlas Search, et il est exact par construction. Les alternatives
 * à la requête (rayon, bbox, contour) ramènent 42 à 82 % de hors-périmètre ou transportent
 * jusqu'à 416 Ko de géométrie par appel (mesures : tools/geo-781, issue ban-plateforme#781).
 *
 * Ordre de résolution, du plus sûr au moins sûr, chaque étape ne s'appliquant que si la
 * précédente n'a rien donné. Chiffres de production du 2026-09-11 (tools/geo-781/compass.md) :
 *  1. code INSEE de la commune (formations) : 92,7 % des formations ;
 *     les arrondissements de Paris, Lyon et Marseille (3 423 formations) sont ramenés à leur
 *     commune, le référentiel ne connaissant pas les arrondissements ;
 *  2. code postal connu du référentiel : 99,4 % des offres ; un CP à cheval sur deux
 *     départements (16 CP, 402 offres) est tranché par la commune du CP la plus proche du géopoint ;
 *  3. code postal inconnu du référentiel mais de forme départementale (CEDEX, 75000, 13000 :
 *     ~160 offres) : le département est lu dans le code lui-même, c'est la règle de numérotation ;
 *  4. géopoint seul (1 185 offres sans CP) : commune dont la bbox contient le point, la plus
 *     proche en cas de recouvrement. Hors de toute bbox, on renonce.
 * Saint-Martin et Saint-Barthélemy (105 offres) ne sont rattachées à rien : ce sont des
 * collectivités, pas des départements, et leur CP commence pourtant par 971. Elles sont exclues
 * de l'étape 3 explicitement et tombent hors de toute bbox à l'étape 4.
 */

export type IAdminCodes = { departement_code: string | null; region_code: string | null }

const NO_CODES: IAdminCodes = { departement_code: null, region_code: null }

type Bbox = [minLon: number, minLat: number, maxLon: number, maxLat: number]

type CommuneRef = {
  insee: string
  departement_code: string
  region_code: string
  centre: [number, number] | null
  bbox: Bbox | null
}

export type AdminCodeIndex = {
  byInsee: Map<string, CommuneRef>
  byZipcode: Map<string, CommuneRef[]>
  regionByDepartement: Map<string, string>
  /** Toutes les communes avec une bbox, pour la résolution par géopoint seul. */
  withBbox: CommuneRef[]
}

export const emptyAdminCodeIndex = (): AdminCodeIndex => ({ byInsee: new Map(), byZipcode: new Map(), regionByDepartement: new Map(), withBbox: [] })

/** Une lecture du référentiel (~35 000 communes) par chargement du contexte de build. */
export const loadAdminCodeIndex = async (): Promise<AdminCodeIndex> => {
  const communes = await getDbCollection("referentiel.communes")
    .find({}, { projection: { _id: 0, code: 1, codesPostaux: 1, codeDepartement: 1, codeRegion: 1, centre: 1, bbox: 1 } })
    .toArray()

  const index = emptyAdminCodeIndex()
  for (const commune of communes) {
    addCommune(index, {
      insee: commune.code,
      departement_code: commune.codeDepartement,
      region_code: commune.codeRegion,
      zipcodes: commune.codesPostaux,
      centre: commune.centre?.coordinates ?? null,
      bbox: toBbox(commune.bbox),
    })
  }
  return index
}

/** Ajout d'une commune à l'index. Exporté pour construire des index de test sans base. */
export const addCommune = (
  index: AdminCodeIndex,
  commune: { insee: string; departement_code: string; region_code: string; zipcodes: string[]; centre: [number, number] | null; bbox: Bbox | null }
): void => {
  const { zipcodes, ...ref } = commune
  index.byInsee.set(ref.insee, ref)
  for (const zipcode of zipcodes) {
    const list = index.byZipcode.get(zipcode)
    if (list) list.push(ref)
    else index.byZipcode.set(zipcode, [ref])
  }
  index.regionByDepartement.set(ref.departement_code, ref.region_code)
  if (ref.bbox) index.withBbox.push(ref)
}

/** La bbox du référentiel est un Polygon GeoJSON à 5 sommets ; on n'en garde que les bornes. */
const toBbox = (geometry: { type: string; coordinates: unknown } | null | undefined): Bbox | null => {
  if (!geometry || geometry.type !== "Polygon") return null
  const ring = (geometry.coordinates as [number, number][][])[0]
  if (!ring?.length) return null
  const lons = ring.map((c) => c[0])
  const lats = ring.map((c) => c[1])
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
}

const toCodes = ({ departement_code, region_code }: CommuneRef): IAdminCodes => ({ departement_code, region_code })

/** Distance au carré en degrés : suffit pour départager des communes voisines, pas besoin de haversine. */
const squaredDistance = (a: [number, number], b: [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

const nearest = (candidates: CommuneRef[], point: [number, number]): CommuneRef | null => {
  let best: CommuneRef | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    if (!candidate.centre) continue
    const d = squaredDistance(candidate.centre, point)
    if (d < bestDistance) {
      bestDistance = d
      best = candidate
    }
  }
  return best
}

const contains = ([minLon, minLat, maxLon, maxLat]: Bbox, [lon, lat]: [number, number]) => lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat

/**
 * Arrondissements municipaux → commune. Le catalogue des formations code Paris, Lyon et
 * Marseille à l'arrondissement ; le référentiel (API Découpage, `/departements/{code}/communes`)
 * ne connaît que la commune. Même département, même région dans les deux cas.
 */
export const ARRONDISSEMENT_PARENT: Record<string, string> = {
  "751": "75056", // Paris 75101–75120
  "693": "69123", // Lyon 69381–69389
  "132": "13055", // Marseille 13201–13216
}

export const normalizeInsee = (insee: string | null | undefined): string | null => {
  const value = insee?.trim().toUpperCase()
  if (!value || value.length !== 5) return null
  return ARRONDISSEMENT_PARENT[value.slice(0, 3)] ?? value
}

/**
 * Collectivités d'outre-mer dont le CP commence par 971 comme la Guadeloupe, sans en faire
 * partie. Sans cette exclusion, la règle de numérotation les rattacherait au 971.
 */
const COLLECTIVITE_ZIPCODES = new Set(["97133", "97150"])

/**
 * Département lu dans un CP de forme départementale (CEDEX, ou 75000 / 13000 sans arrondissement).
 * C'est la règle de numérotation postale : deux premiers chiffres, trois pour l'outre-mer.
 * La Corse (20xxx) est ambiguë entre 2A et 2B : on ne tranche pas ici, le géopoint le fera.
 */
const departementFromZipcode = (zipcode: string, index: AdminCodeIndex): IAdminCodes | null => {
  if (COLLECTIVITE_ZIPCODES.has(zipcode)) return null
  if (zipcode.startsWith("20")) return null
  const departement_code = zipcode.startsWith("97") ? zipcode.slice(0, 3) : zipcode.slice(0, 2)
  const region_code = index.regionByDepartement.get(departement_code)
  return region_code ? { departement_code, region_code } : null
}

export const resolveAdminCodes = (source: { insee?: string | null; zipcode?: string | null; geopoint?: IPointGeometry | null }, index: AdminCodeIndex): IAdminCodes => {
  const insee = normalizeInsee(source.insee)
  if (insee) {
    const ref = index.byInsee.get(insee)
    if (ref) return toCodes(ref)
  }

  const point = source.geopoint?.coordinates

  const zipcode = normalizeZipcode(source.zipcode)
  if (zipcode) {
    const candidates = index.byZipcode.get(zipcode)
    if (candidates?.length) {
      const departements = new Set(candidates.map((c) => c.departement_code))
      if (departements.size === 1) return toCodes(candidates[0])
      // CP à cheval : la commune du CP la plus proche du géopoint. Sans géopoint, on renonce
      // plutôt que de choisir au hasard.
      const best = point ? nearest(candidates, point) : null
      return best ? toCodes(best) : NO_CODES
    }
    const fromZipcode = departementFromZipcode(zipcode, index)
    if (fromZipcode) return fromZipcode
  }

  if (point) {
    const enclosing = index.withBbox.filter((c) => contains(c.bbox!, point))
    const best = nearest(enclosing, point)
    if (best) return toCodes(best)
  }

  return NO_CODES
}

/** "44 000" → "44000", "4400" → "04400" (zéro initial perdu par un cast numérique en amont). */
export const normalizeZipcode = (zipcode: string | null | undefined): string | null => {
  if (!zipcode) return null
  const digits = zipcode.replace(/\D/g, "")
  if (!digits || digits.length > 5) return null
  return digits.padStart(5, "0")
}
