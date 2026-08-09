import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "applicants_email_logs" as const

export enum EMAIL_LOG_TYPE {
  RELANCE = "RELANCE",
  RELANCE_INACTIVITE = "RELANCE_INACTIVITE",
  RELANCE_INCITATION_SPONTANEE = "RELANCE_INCITATION_SPONTANEE",
  NOTIFICATION = "NOTIFICATION",
  INTENTION_ENTRETIEN = "INTENTION_ENTRETIEN",
  INTENTION_REFUS = "INTENTION_REFUS",
}
export const ZApplicantEmailLog = z.strictObject({
  _id: zObjectId,
  applicant_id: zObjectId,
  application_id: zObjectId.nullable(),
  type: extensions.buildEnum(EMAIL_LOG_TYPE),
  message_id: z.string().nullable(),
  createdAt: z.date(),
})

export type IApplicantEmailLog = z.output<typeof ZApplicantEmailLog>

export default {
  zod: ZApplicantEmailLog,
  indexes: [[{ applicant_id: 1, type: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
