import { ApplicantIntention } from "../constants/application"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "recruiter_intention_mails" as const

export const ZRecruiterIntentionMail = z.object({
  _id: zObjectId,
  applicationId: zObjectId,
  intention: extensions.buildEnum(ApplicantIntention),
  createdAt: z.date(),
})
export type IRecruiterIntentionMail = z.output<typeof ZRecruiterIntentionMail>

export default {
  zod: ZRecruiterIntentionMail,
  indexes: [[{ applicationId: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
