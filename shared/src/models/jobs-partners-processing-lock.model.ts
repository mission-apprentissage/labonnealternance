import { z } from "zod"

import type { IModelDescriptor } from "./common.js"

const collectionName = "jobs_partners_processing_locks" as const

/**
 * Verrou par partenaire : un seul traitement (import, process computed, missing rome…) à la fois
 * sur les offres d'un même partner_label. Le document est supprimé à la libération.
 * `_id` = partner_label : l'exclusivité repose sur l'unicité de `_id`, garantie sans index ni migration.
 */
export const ZJobsPartnersProcessingLock = z.object({
  _id: z.string(),
  partner_label: z.string(),
  owner: z.string().optional().describe("Identifiant du traitement qui détient le verrou"),
  acquired_at: z.date().optional(),
  expires_at: z.date().optional().describe("Au-delà, le verrou est considéré orphelin (traitement tué) et peut être repris"),
})

export type IJobsPartnersProcessingLock = z.output<typeof ZJobsPartnersProcessingLock>

export default {
  zod: ZJobsPartnersProcessingLock,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
