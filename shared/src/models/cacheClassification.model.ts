import { z } from "zod"

import { IModelDescriptor } from "./common.js"

const collectionName = "cache_classification" as const

const ZClassitifationJobsPartners = z.object({
  partner_job_id: z.string(),
  partner_label: z.string(),
  classification: z.string(),
  score: z.object({
    cfa: z.number(),
    entreprise: z.number(),
    entreprise_cfa: z.number(),
  }),
})
export type IClassificationJobsPartners = z.output<typeof ZClassitifationJobsPartners>

export const ZClassificationLabResponse = z.object({
  label: z.string(),
  score: ZClassitifationJobsPartners.shape.score,
  text: z.string(),
})
export type IClassificationLabResponse = z.output<typeof ZClassificationLabResponse>

export default {
  zod: ZClassitifationJobsPartners,
  indexes: [[{ partner_job_id: 1, partner_label: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
