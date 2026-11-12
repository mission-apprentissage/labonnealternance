import type { IPointGeometry, IReferentielCommune } from "shared/models/index"
import type { IPartnerSearchLinkPartner } from "shared/routes/_private/partner-search.routes"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { loadRomeLabelByCode } from "./search-items.service"
import type { Bbox } from "./search-items-admin-codes"
import { contains, toBbox } from "./search-items-admin-codes"

/**
 * Résolution d'un lien partenaire (`/monmaster/<RNCP>`) en recherche `/recherche`.
 *
 * Résolution 100 % locale (catalogue des formations + référentiel ROME), sans appel à l'API
 * Apprentissage : la page publique ne doit pas pouvoir servir de proxy vers notre quota externe en
 * énumérant les codes RNCP (#5871).
 */

export type IPartnerSearchLinkOutcome = "resolved" | "code_invalide" | "rncp_inconnu" | "sans_libelle"

export type IPartnerSearchLink = { q: string | null; lieu_label: string | null }

// Même borne que validateRncp (query-validator.service) ; préfixe facultatif, casse ignorée.
const RNCP_CODE_PATTERN = /^(?:RNCP)?(\d{2,5})$/i

// Une certification très répandue (BTS, CAP) compte des milliers de formations : l'échantillon
// borne le coût d'un clic. Au-delà, le libellé retenu est celui des 1 000 premières par clé.
const MAX_FORMATIONS_SAMPLE = 1000

// Rayon de rattachement du point à une commune hors de toute bbox (point en mer, hors de France) :
// au-delà, on ne nomme pas une commune lointaine.
const LIEU_LABEL_MAX_DISTANCE_METERS = 20_000

// Candidats à la bbox contenant le point, par centre le plus proche (index 2dsphere sur `centre`,
// aucun sur `bbox`). En métropole, aucun coin de bbox n'est à plus de 30 km de son centre (Arles) ;
// seules 11 communes de Guyane dépassent 50 km et retombent sur le centre le plus proche.
const LIEU_CANDIDATES_MAX_DISTANCE_METERS = 50_000
const LIEU_MAX_CANDIDATES = 100

// Borne de `q` sur /v1/search : au-delà, la recherche de destination répondrait 400.
const MAX_Q_LENGTH = 200

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MAX_CACHED_RNCP = 5000

export function normalizeRncpCode(code: string): string | null {
  const match = RNCP_CODE_PATTERN.exec(code.trim())
  return match ? `RNCP${match[1]}` : null
}

/** Cache borné en nombre d'entrées et en durée : un balayage de codes aléatoires ne fait pas grossir la mémoire. */
export class BoundedTtlCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>()

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number
  ) {}

  get(key: string): V | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    this.entries.delete(key)
    if (entry.expiresAt <= Date.now()) return undefined
    // Réinsertion : l'ordre d'insertion de la Map sert d'ordre LRU.
    this.entries.set(key, entry)
    return entry.value
  }

  set(key: string, value: V): void {
    this.entries.delete(key)
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs })
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }

  get size(): number {
    return this.entries.size
  }

  clear(): void {
    this.entries.clear()
  }
}

type IRncpResolution = { q: string | null; outcome: Exclude<IPartnerSearchLinkOutcome, "code_invalide"> }

export const rncpResolutionCache = new BoundedTtlCache<IRncpResolution>(MAX_CACHED_RNCP, CACHE_TTL_MS)

let romeLabelsCache: { value: Promise<Map<string, string>>; expiresAt: number } | null = null

const getRomeLabelByCode = (): Promise<Map<string, string>> => {
  if (!romeLabelsCache || romeLabelsCache.expiresAt <= Date.now()) {
    const value = loadRomeLabelByCode()
    romeLabelsCache = { value, expiresAt: Date.now() + CACHE_TTL_MS }
    // Un échec de chargement ne doit pas rester en cache 24 h.
    value.catch(() => {
      if (romeLabelsCache?.value === value) romeLabelsCache = null
    })
  }
  return romeLabelsCache.value
}

export const resetPartnerSearchLinkCaches = () => {
  rncpResolutionCache.clear()
  romeLabelsCache = null
}

/** Valeurs triées par fréquence décroissante, à égalité par ordre de première apparition. */
const byFrequency = (values: string[]): string[] => {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value)
}

async function resolveRncp(rncp: string): Promise<IRncpResolution> {
  const formations = await getDbCollection("formationcatalogues")
    .find({ rncp_code: rncp }, { projection: { _id: 0, rome_codes: 1, intitule_long: 1 } })
    // Ordre stable : sans tri, le libellé retenu à égalité dépendrait de l'ordre naturel Mongo.
    .sort({ cle_ministere_educatif: 1 })
    .limit(MAX_FORMATIONS_SAMPLE)
    .toArray()

  if (!formations.length) return { q: null, outcome: "rncp_inconnu" }

  // Libellé ROME d'abord, comme getFormationSearchLabel (training-links.service) : c'est le signal
  // le plus boosté du moteur, un intitulé long de formation finit souvent à 0 résultat.
  const romeLabelByCode = await getRomeLabelByCode()
  const romeCodes = byFrequency(formations.flatMap((formation) => formation.rome_codes ?? []))
  const romeLabel = romeCodes.map((code) => romeLabelByCode.get(code)).find(Boolean)
  if (romeLabel) return { q: romeLabel, outcome: "resolved" }

  const intitules = formations.map((formation) => formation.intitule_long?.trim())
  const [intitule] = byFrequency(intitules.filter((intitule): intitule is string => !!intitule && intitule.length <= MAX_Q_LENGTH))
  if (intitule) return { q: intitule, outcome: "resolved" }

  return { q: null, outcome: "sans_libelle" }
}

/** Distance du point au centre, en demi-axes de la bbox : 1 = bord de la bbox, quelle que soit la taille de la commune. */
const distanceInBboxAxes = ([minLon, minLat, maxLon, maxLat]: Bbox, centre: [number, number], [lon, lat]: [number, number]): number => {
  const lonScale = Math.cos((lat * Math.PI) / 180)
  const halfWidth = ((maxLon - minLon) * lonScale) / 2
  const halfHeight = (maxLat - minLat) / 2
  if (halfWidth <= 0 || halfHeight <= 0) return Number.POSITIVE_INFINITY
  return Math.hypot(((lon - centre[0]) * lonScale) / halfWidth, (lat - centre[1]) / halfHeight)
}

/**
 * Commune dont la bbox contient le point, la plus centrale rapportée à sa taille quand les bbox se
 * recouvrent ; à défaut, centre le plus proche. Le centre le plus proche seul nomme souvent une
 * petite voisine d'une grande commune (Le Tholonet pour Aix-en-Provence).
 */
async function resolveLieuLabel(latitude: number, longitude: number): Promise<string | null> {
  const point: [number, number] = [longitude, latitude]
  const candidates = await getDbCollection("referentiel.communes")
    .aggregate<{ nom: string; centre: IPointGeometry; bbox: IReferentielCommune["bbox"]; distance: number }>([
      { $geoNear: { near: { type: "Point", coordinates: point }, key: "centre", distanceField: "distance", maxDistance: LIEU_CANDIDATES_MAX_DISTANCE_METERS } },
      { $limit: LIEU_MAX_CANDIDATES },
      { $project: { _id: 0, nom: 1, centre: 1, bbox: 1, distance: 1 } },
    ])
    .toArray()

  let best: { nom: string; score: number } | null = null
  for (const candidate of candidates) {
    const bbox = toBbox(candidate.bbox)
    if (!bbox || !contains(bbox, point)) continue
    const score = distanceInBboxAxes(bbox, candidate.centre.coordinates as [number, number], point)
    if (!best || score < best.score) best = { nom: candidate.nom, score }
  }
  if (best) return best.nom

  const [nearest] = candidates
  return nearest && nearest.distance <= LIEU_LABEL_MAX_DISTANCE_METERS ? nearest.nom : null
}

export async function resolvePartnerSearchLink({
  partner,
  code,
  latitude,
  longitude,
}: {
  partner: IPartnerSearchLinkPartner
  code: string
  latitude?: number
  longitude?: number
}): Promise<IPartnerSearchLink> {
  const hasGeo = latitude !== undefined && longitude !== undefined
  const rncp = normalizeRncpCode(code)
  const fromCache = rncp === null ? undefined : rncpResolutionCache.get(rncp)

  const [resolution, lieu_label] = await Promise.all([
    rncp === null ? { q: null, outcome: "code_invalide" as const } : (fromCache ?? resolveRncp(rncp)),
    hasGeo ? resolveLieuLabel(latitude, longitude) : null,
  ])
  if (rncp !== null && fromCache === undefined) rncpResolutionCache.set(rncp, resolution as IRncpResolution)

  // Volume et taux d'échec suivis dans Loki : un repli géo seule n'est sinon pas distinguable d'un lien résolu.
  logger.info({ partner, rncp: rncp ?? code, outcome: resolution.outcome, cached: fromCache !== undefined, has_geo: hasGeo }, "partner search link")

  return { q: resolution.q, lieu_label }
}
