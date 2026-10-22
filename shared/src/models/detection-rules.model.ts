import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "detection_rules" as const

/**
 * Réglages et créneau courant d'une règle de détection (#5421). Les règles sont déclarées dans le code :
 * ce document ne porte que ce qui se règle sans redéploiement, et le créneau déjà réservé par une exécution.
 */
export const ZDetectionRuleState = z.object({
  _id: zObjectId,
  rule_id: z.string(),
  enabled: z.boolean().nullable().describe("null : activation par défaut de la règle"),
  thresholds: z
    .record(z.string(), z.union([z.number(), z.string(), z.boolean()]))
    .nullable()
    .describe("Seuils surchargés, validés par le schéma de la règle ; null : seuils par défaut"),
  updated_at: z.date().nullable().describe("Dernière modification des réglages"),
  last_slot_at: z.date().nullable().describe("Dernier créneau réservé par une exécution"),
})

export type IDetectionRuleState = z.output<typeof ZDetectionRuleState>

export default {
  zod: ZDetectionRuleState,
  indexes: [[{ rule_id: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
