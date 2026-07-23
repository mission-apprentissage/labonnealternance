import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "mistral_batch_jobs" as const

/**
 * Suivi des jobs batch Mistral soumis en fire-and-forget : un cron (`applyPendingMistralBatches`)
 * ramasse les jobs terminés (téléchargement du fichier de sortie + application) — la reprise
 * survit aux redéploiements, plus aucun traitement manuel requis. `kind` identifie le
 * consommateur (extensible à d'autres usages que les keywords).
 */
export const ZMistralBatchJob = z.object({
  _id: zObjectId,
  job_id: z.string().describe("Identifiant du job batch côté Mistral"),
  kind: z.enum(["search_items_keywords"]).describe("Consommateur du batch (détermine l'application du résultat)"),
  status: z.enum(["submitted", "applied", "failed"]),
  request_count: z.number().describe("Nombre de requêtes soumises"),
  applied_count: z.number().nullable().describe("Nombre de lignes appliquées (null tant que non ramassé)"),
  error: z.string().nullable().describe("Détail en cas d'échec (statut Mistral ou erreur d'application)"),
  submitted_at: z.date(),
  checked_at: z.date().nullable().describe("Dernière vérification de statut"),
  applied_at: z.date().nullable(),
})

export type IMistralBatchJob = z.output<typeof ZMistralBatchJob>

export default {
  zod: ZMistralBatchJob,
  indexes: [
    [{ job_id: 1 }, { unique: true }],
    [{ status: 1, kind: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
