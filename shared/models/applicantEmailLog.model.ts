import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "applicants_email_logs" as const

export const ZApplicantEmailLog = z
  .object({
    _id: zObjectId,
    applicant_id: zObjectId,
    type: z.enum(["RELANCE", "NOTIFICATION"]),
    message_id: z.string(),
    createdAt: z.date(),
  })
  .strict()

export type IApplicantEmailLog = z.output<typeof ZApplicantEmailLog>

export default {
  zod: ZApplicantEmailLog,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
