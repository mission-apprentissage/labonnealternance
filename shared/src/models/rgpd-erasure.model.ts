import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "rgpd_erasures" as const

export const RGPD_USER_TYPE = {
  ENTREPRISE: "ENTREPRISE",
  CFA: "CFA",
  OPCO_ADMIN: "OPCO_ADMIN",
  CANDIDAT: "CANDIDAT",
  CANDIDAT_RDVA: "CANDIDAT_RDVA",
} as const
export type IRgpdUserType = (typeof RGPD_USER_TYPE)[keyof typeof RGPD_USER_TYPE]

export const RGPD_USER_TYPE_LABEL: Record<IRgpdUserType, string> = {
  ENTREPRISE: "Recruteur entreprise",
  CFA: "CFA",
  OPCO_ADMIN: "OPCO ou administrateur",
  CANDIDAT: "Candidat (candidatures)",
  CANDIDAT_RDVA: "Candidat (rendez-vous apprentissage)",
}

export const RGPD_ERASURE_MODE = {
  ANONYMIZE: "anonymize",
  DELETE: "delete",
} as const
export type IRgpdErasureMode = (typeof RGPD_ERASURE_MODE)[keyof typeof RGPD_ERASURE_MODE]

export const RGPD_ERASURE_STATUS = {
  DONE: "done",
  PARTIAL: "partial",
  FAILED: "failed",
} as const
export type IRgpdErasureStatus = (typeof RGPD_ERASURE_STATUS)[keyof typeof RGPD_ERASURE_STATUS]

/** Statut de la trace pendant l'exécution : s'il reste en place, l'effacement s'est arrêté sans rendre compte. */
export const RGPD_ERASURE_IN_PROGRESS = "in_progress" as const

export const ZRgpdErasureStep = z.object({
  collection: z.string().describe("Collection ou service externe concerné"),
  action: z.string().describe("Action appliquée, en clair"),
  count: z.number().int().nullable().describe("Documents concernés ; null pour un service externe non interrogé à l'aperçu"),
})
export type IRgpdErasureStep = z.output<typeof ZRgpdErasureStep>

export const ZRgpdErasureFailure = z.object({
  collection: z.string(),
  message: z.string().describe("Message d'erreur, sans donnée personnelle"),
})
export type IRgpdErasureFailure = z.output<typeof ZRgpdErasureFailure>

/** Trace d'une demande d'effacement : prouve son traitement sans conserver l'e-mail en clair. */
export const ZRgpdErasure = z.object({
  _id: zObjectId,
  email_hash: z.string().describe("HMAC-SHA256 de l'e-mail normalisé (cf. hashRgpdEmail)"),
  user_type: extensions.buildEnum(RGPD_USER_TYPE),
  mode: extensions.buildEnum(RGPD_ERASURE_MODE),
  request_ref: z.string().nullable().describe("Référence de la demande (ticket, courrier), sans donnée personnelle"),
  requested_by: zObjectId.nullable().describe("Administrateur à l'origine de l'effacement, null depuis la CLI"),
  requested_at: z.date(),
  status: z.union([extensions.buildEnum(RGPD_ERASURE_STATUS), z.literal(RGPD_ERASURE_IN_PROGRESS)]),
  steps: z.array(ZRgpdErasureStep),
  failures: z.array(ZRgpdErasureFailure),
})
export type IRgpdErasure = z.output<typeof ZRgpdErasure>

export default {
  zod: ZRgpdErasure,
  indexes: [
    [{ email_hash: 1 }, {}],
    [{ requested_at: -1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
