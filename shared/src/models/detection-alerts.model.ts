import { z } from "zod"

import { buildEnum } from "../helpers/zod-helpers/zod-primitives-light.js"
import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "detection_alerts" as const

export const DETECTION_SEVERITIES = ["haute", "moyenne", "technique"] as const

/** `en_attente` : constat pas encore confirmé (cf. `confirmations` de la règle), rien n'a été notifié. */
export const DETECTION_ALERT_STATUS = {
  EN_ATTENTE: "en_attente",
  OUVERTE: "ouverte",
  FERMEE: "fermee",
} as const

export const DETECTION_ALERT_ACTIVE_STATUSES = [DETECTION_ALERT_STATUS.EN_ATTENTE, DETECTION_ALERT_STATUS.OUVERTE] as const

export const DETECTION_QUALIFICATION_VERDICTS = {
  VRAI_POSITIF: "vrai_positif",
  FAUX_POSITIF: "faux_positif",
} as const

export type IDetectionSeverity = (typeof DETECTION_SEVERITIES)[number]
export type IDetectionAlertStatus = (typeof DETECTION_ALERT_STATUS)[keyof typeof DETECTION_ALERT_STATUS]
export type IDetectionQualificationVerdict = (typeof DETECTION_QUALIFICATION_VERDICTS)[keyof typeof DETECTION_QUALIFICATION_VERDICTS]

/** Comptes, taux et identifiants techniques : jamais de donnée personnelle (#5421). */
export const ZDetectionMetrics = z.record(z.string(), z.union([z.number(), z.string(), z.boolean(), z.null()]))

/**
 * Un épisode d'alerte d'une règle de détection (#5421) : de l'entrée à la sortie, quel que soit le nombre de rappels.
 * Persisté pour mesurer a posteriori le taux de faux positifs de chaque règle.
 */
export const ZDetectionAlert = z.object({
  _id: zObjectId,
  rule_id: z.string(),
  key: z.string().describe("Objet de l'alerte au sein de la règle : identifiant technique, ou « global »"),
  severity: z.enum(DETECTION_SEVERITIES),
  status: buildEnum(DETECTION_ALERT_STATUS),
  hits: z.number().int().positive().describe("Constats consécutifs"),
  first_seen_at: z.date(),
  last_seen_at: z.date().describe("Créneau du dernier constat"),
  opened_at: z.date().nullable().describe("Entrée en alerte, null tant que le constat n'est pas confirmé"),
  last_notified_at: z.date().nullable(),
  notification_count: z.number().int().nonnegative(),
  closed_at: z.date().nullable(),
  opening_metrics: ZDetectionMetrics.nullable(),
  last_metrics: ZDetectionMetrics,
  summary: z.string().describe("Phrase du dernier constat, telle que notifiée"),
  qualification: z
    .object({
      verdict: buildEnum(DETECTION_QUALIFICATION_VERDICTS),
      at: z.date(),
    })
    .nullable(),
})

export type IDetectionMetrics = z.output<typeof ZDetectionMetrics>
export type IDetectionAlert = z.output<typeof ZDetectionAlert>

export default {
  zod: ZDetectionAlert,
  indexes: [
    // Un seul épisode actif par objet : garde-fou si deux exécutions évaluaient le même créneau (cf. claimSlot).
    [
      { rule_id: 1, key: 1 },
      { unique: true, partialFilterExpression: { status: { $in: [...DETECTION_ALERT_ACTIVE_STATUSES] } }, name: "rule_id_1_key_1_active_unique" },
    ],
    [{ rule_id: 1, status: 1 }, {}],
    [{ opened_at: -1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
