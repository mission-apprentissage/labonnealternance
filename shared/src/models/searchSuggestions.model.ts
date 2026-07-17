import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "search_suggestions" as const

/**
 * Suggestions d'autocomplétion issues des recherches utilisateurs (collection `search_queries`),
 * validées par le job `analyzeSearchQueries` (critères quantitatifs + classification Mistral).
 * Interrogée par suggestSearchTerms en complément de l'index `search_items` (title/rome_labels).
 * Les candidats REJETÉS sont conservés (status "rejected" + motif) : dédup entre runs, audit,
 * et requalification manuelle possible. Réversibilité : par run (run_id), unitaire (status
 * "disabled") ou globale (updateMany origin → disabled) — hot-reload mongot ~5 s.
 */
export const ZSearchSuggestion = z.object({
  _id: zObjectId,
  term: z.string().describe("Terme affiché dans l'autocomplete (forme canonique corrigée par l'IA)"),
  normalized: z.string().describe("Clé unique de déduplication (normalizeQuery)"),
  origin: z.literal("user_queries").describe("Provenance (extensible : import manuel, etc.)"),
  status: z.enum(["active", "disabled", "rejected"]),
  rejection_reason: z.string().nullable().describe("Motif si rejected (audit + anti-re-proposition)"),
  category: z.enum(["metier", "formation", "secteur", "competence", "entreprise"]).nullable(),
  counters: z
    .object({
      total_30d: z.number(),
      days_seen_30d: z.number(),
      zero_hits_30d: z.number(),
      free_text_30d: z.number(),
      median_nb_hits: z.number(),
    })
    .describe("Snapshot des statistiques au moment de la décision"),
  confidence: z.number().nullable().describe("Confiance de la classification Mistral (0-1)"),
  run_id: z.string().describe("Identifiant du run d'analyse (rollback groupé)"),
  created_at: z.date(),
  last_seen_at: z.date(),
})

export type ISearchSuggestion = z.output<typeof ZSearchSuggestion>

export default {
  zod: ZSearchSuggestion,
  indexes: [
    [{ normalized: 1 }, { unique: true }],
    [{ run_id: 1 }, {}],
    [{ status: 1 }, {}],
  ],
  searchIndexes: [
    {
      name: "search_suggestions_index",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            term: [{ type: "autocomplete", tokenization: "edgeGram", minGrams: 3, maxGrams: 15, foldDiacritics: true }],
            status: { type: "token" },
          },
        },
      },
    },
  ],
  collectionName,
} as const satisfies IModelDescriptor
