import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "search_items_keywords" as const

/**
 * Cache des mots-clés générés par Mistral pour `search_items`, keyé par le HASH du texte
 * source (pas par document) : les recruteurs partagent massivement les mêmes rome_labels
 * (mêmes combinaisons ROME par NAF) et les offres re-créées à texte identique (rotation des
 * flux) ne coûtent ainsi qu'un seul appel. Résilience : une régénération de `search_items`
 * ne perd plus les keywords.
 *
 * `keywords: []` = le texte a été traité mais Mistral n'a rien produit d'utilisable
 * (réponse invalide/vide) — le document sort de la file sans re-boucler.
 */
export const ZSearchItemKeywords = z.object({
  _id: zObjectId,
  source_hash: z.string().describe("sha256 du texte source exact envoyé à Mistral (tronqué à 2000 caractères, sans autre normalisation)"),
  keywords: z.array(z.string()).describe("Mots-clés générés ([] = traité, rien d'utilisable)"),
  model: z.string().describe("Modèle Mistral utilisé"),
  origin: z.enum(["immediate", "batch", "manual_import"]).describe("Voie de génération"),
  created_at: z.date(),
  last_used_at: z.date().describe("Dernière réutilisation par un document"),
})

export type ISearchItemKeywords = z.output<typeof ZSearchItemKeywords>

export default {
  zod: ZSearchItemKeywords,
  indexes: [[{ source_hash: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
