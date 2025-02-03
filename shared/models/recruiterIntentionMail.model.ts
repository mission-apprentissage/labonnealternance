import { ApplicationIntention } from "../constants/application.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "recruiter_intention_mails" as const

export const ZRecruiterIntentionMail = z.object({
  _id: zObjectId,
  applicationId: zObjectId,
  intention: extensions.buildEnum(ApplicationIntention),
  createdAt: z.date(),
})
export type IRecruiterIntentionMail = z.output<typeof ZRecruiterIntentionMail>

export default {
  zod: ZRecruiterIntentionMail,
  indexes: [[{ applicationId: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
