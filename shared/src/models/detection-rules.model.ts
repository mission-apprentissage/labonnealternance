import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "detection_rules" as const

/**
 * Réglages et état d'exécution d'une règle de détection (#5421). Les règles sont déclarées dans le code :
 * ce document ne porte que ce qui se règle sans redéploiement, le dernier créneau évalué et le bail de l'évaluation en cours.
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
  last_slot_at: z.date().nullable().describe("Dernier créneau évalué jusqu'au bout"),
  lease_owner: z.string().nullable().describe("Exécution qui évalue la règle ; null hors évaluation"),
  lease_until: z.date().nullable().describe("Fin du bail de lease_owner, prolongée tant que l'évaluation tourne"),
})

export type IDetectionRuleState = z.output<typeof ZDetectionRuleState>

export default {
  zod: ZDetectionRuleState,
  indexes: [[{ rule_id: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
