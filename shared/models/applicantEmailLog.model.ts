import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "applicants_email_logs" as const

export enum EMAIL_LOG_TYPE {
  RELANCE = "RELANCE",
  NOTIFICATION = "NOTIFICATION",
  INTENTION_ENTRETIEN = "INTENTION_ENTRETIEN",
  INTENTION_REFUS = "INTENTION_REFUS",
}
export const ZApplicantEmailLog = z
  .object({
    _id: zObjectId,
    applicant_id: zObjectId,
    application_id: zObjectId.nullable(),
    type: extensions.buildEnum(EMAIL_LOG_TYPE),
    message_id: z.string().nullable(),
    createdAt: z.date(),
  })
  .strict()

export type IApplicantEmailLog = z.output<typeof ZApplicantEmailLog>

export default {
  zod: ZApplicantEmailLog,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
