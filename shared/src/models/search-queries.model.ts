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
  // "degraded" : searchItems a dû retenter sans fuzzy/synonymes suite à maxClauseCount dépassé
  // (cf. #5153) — succès quand même, mais signal à part du "ok" pour repérer les requêtes qui
  // stressent le moteur. "error" : searchItems a levé une exception non récupérée ; nb_hits est
  // alors null (avant #5153/#5166, la quasi-totalité des échecs n'étaient jamais logués du tout
  // puisque ce log n'était appelé qu'après un succès — ce champ comble ce trou).
  status: z.enum(["ok", "degraded", "error"]).describe("Issue de la recherche : succès normal, succès après repli, ou échec"),
  nb_hits: z.number().nullable().describe("Nombre de résultats retournés (null si status=error)"),
  // Renommé depuis `source` (migration 20260824) : « source » est un paramètre réservé de
  // Plausible (attribution d'acquisition) — le nom est banni de toute la chaîne (URL, API, base)
  // pour ne pas polluer les stats. L'URL et l'API acceptent encore l'ancien nom en alias.
  search_source: z
    .enum(["suggestion", "free_text", "training_links", "external_sites"])
    .describe("Suggestion d'autocomplete sélectionnée vs texte libre vs lien généré côté serveur (traininglinks, vœux Parcoursup) vs lien personnalisé posé par un site externe"),
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
