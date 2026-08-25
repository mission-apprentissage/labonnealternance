import { z } from "zod"
import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "cache_classification" as const

const ZClassitifationJobsPartners = z.object({
  _id: zObjectId,
  partner_job_id: z.string(),
  partner_label: z.string(),
  classification: z.string(),
  scores: z.object({
    publish: z.number(),
    unpublish: z.number(),
  }),
  human_verification: z.enum(["publish", "unpublish"]).nullish(),
  model: z.string().nullish(),
  created_at: z.date().nullish(),
})
export type IClassificationJobsPartners = z.output<typeof ZClassitifationJobsPartners>

export default {
  zod: ZClassitifationJobsPartners,
  indexes: [
    [{ partner_job_id: 1, partner_label: 1 }, {}],
    [{ human_verification: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
