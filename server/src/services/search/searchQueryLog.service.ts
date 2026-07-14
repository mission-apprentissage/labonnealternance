import { ObjectId } from "mongodb"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"

import { normalizeTerm, tokenizeQuery } from "./search.service"

/**
 * Log au fil de l'eau des recherches utilisateurs → collection `search_queries`.
 * Contraintes : appelé en fire-and-forget depuis le contrôleur /v1/search (jamais d'await),
 * ne doit JAMAIS throw ni ralentir la réponse. RGPD : pas d'IP / user / referer, requêtes
 * contenant des PII jamais loggées, géo arrondie à ~11 km. Cf. searchQueries.model.ts.
 */

// Détection PII dans le texte libre : email, téléphone FR, longues séquences de chiffres
// (SIRET, NIR, CB). Match → la recherche n'est pas loggée du tout (plus sûr que la rédaction).
const PII_PATTERNS: RegExp[] = [
  /\S+@\S+\.\S+/, // email
  /(\+33|0)\s*[1-9]([ .-]?\d{2}){4}/, // téléphone FR
  /\d[\d .-]{7,}\d/, // ≥ 8 chiffres (avec séparateurs éventuels)
]

export function containsPii(q: string): boolean {
  return PII_PATTERNS.some((pattern) => pattern.test(q))
}

/** Clé d'agrégation : termes utiles normalisés (sans accents/stopwords/doublets M-F), joints par espace. */
export function normalizeQuery(q: string): string {
  return tokenizeQuery(q).map(normalizeTerm).join(" ")
}

type SearchQuerystring = {
  q?: string
  type?: string
  type_filter_label?: string[]
  contract_type?: string[]
  level?: string[]
  activity_sector?: string[]
  organization_name?: string
  sort?: string
  latitude?: number
  longitude?: number
  radius?: number
  source?: "suggestion" | "free_text"
}

// Arrondi à 1 décimale (~11 km) : suffisant pour "quelle zone cherche quoi", inexploitable
// pour ré-identifier une personne.
const roundCoord = (value: number) => Math.round(value * 10) / 10

export async function logSearchQuery(query: SearchQuerystring, nbHits: number): Promise<void> {
  try {
    const q = query.q?.trim().slice(0, 200)
    if (!q || containsPii(q)) return

    const q_normalized = normalizeQuery(q)
    if (!q_normalized) return

    const hasGeo = query.latitude !== undefined && query.longitude !== undefined
    const now = new Date()

    await getDbCollection("search_queries").insertOne({
      _id: new ObjectId(),
      q,
      q_normalized,
      nb_hits: nbHits,
      source: query.source ?? "free_text",
      filters: {
        type: query.type ?? null,
        type_filter_label: query.type_filter_label?.length ?? 0,
        contract_type: query.contract_type?.length ?? 0,
        level: query.level?.length ?? 0,
        activity_sector: query.activity_sector?.length ?? 0,
        has_organization: Boolean(query.organization_name),
        sort: query.sort ?? null,
      },
      has_geo: hasGeo,
      geo: hasGeo ? { lat: roundCoord(query.latitude!), lng: roundCoord(query.longitude!) } : null,
      radius: hasGeo ? (query.radius ?? null) : null,
      created_at: now,
    })
  } catch (error) {
    // Silencieux : une panne du log ne doit jamais impacter la recherche.
    sentryCaptureException(error)
  }
}
