import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "search_queries" as const

/**
 * Log au fil de l'eau des recherches utilisateurs (/v1/search, page 0, q non vide).
 * Alimente le job d'analyse `analyzeSearchQueries` (enrichissement du moteur de suggestion).
 * RGPD : aucune IP / user id / referer ; q pré-filtré par regex PII (pas de log si match) ;
 * géo arrondie à 1 décimale (~11 km) ; TTL 180 jours.
 */
export const ZSearchQuery = z.object({
  _id: zObjectId,
  q: z.string().max(200).describe("Requête brute saisie (tronquée à 200 caractères, PII pré-filtrées)"),
  q_normalized: z.string().describe("Clé d'agrégation : termes tokenizeQuery normalisés, joints par espace"),
  nb_hits: z.number().describe("Nombre de résultats retournés"),
  source: z.enum(["suggestion", "free_text"]).describe("Suggestion d'autocomplete sélectionnée vs texte libre"),
  filters: z
    .object({
      type: z.string().nullable(),
      type_filter_label: z.number().describe("Nombre de valeurs actives"),
      contract_type: z.number(),
      level: z.number(),
      activity_sector: z.number(),
      has_organization: z.boolean(),
      sort: z.string().nullable(),
    })
    .describe("Contexte de filtres, compact (compteurs, pas les valeurs)"),
  has_geo: z.boolean(),
  geo: z.object({ lat: z.number(), lng: z.number() }).nullable().describe("Position arrondie à 1 décimale (~11 km)"),
  radius: z.number().nullable(),
  created_at: z.date(),
})

export type ISearchQuery = z.output<typeof ZSearchQuery>

export default {
  zod: ZSearchQuery,
  indexes: [
    // TTL 180 jours : purge automatique du log brut.
    [{ created_at: 1 }, { expireAfterSeconds: 15552000 }],
    // Agrégation du job d'analyse ($group par q_normalized sur fenêtre glissante).
    [{ created_at: 1, q_normalized: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
