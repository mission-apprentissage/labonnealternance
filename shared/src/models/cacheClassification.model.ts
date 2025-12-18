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
    cfa: z.number(),
    entreprise: z.number(),
    entreprise_cfa: z.number(),
  }),
  human_verification: z.enum(["cfa", "entreprise", "entreprise_cfa"]).nullish(),
})
export type IClassificationJobsPartners = z.output<typeof ZClassitifationJobsPartners>

export const ZClassificationLabResponse = z.object({
  label: z.enum(["cfa", "entreprise", "entreprise_cfa"]),
  scores: ZClassitifationJobsPartners.shape.scores,
  text: z.string(),
  model: z.string(),
})
export type IClassificationLabResponse = z.output<typeof ZClassificationLabResponse>

export const ZClassificationLabBatchResponse = z
  .object({
    id: z.string(),
    label: z.enum(["cfa", "entreprise", "entreprise_cfa"]),
    scores: ZClassitifationJobsPartners.shape.scores,
    text: z.string(),
    model: z.string(),
  })
  .array()

export type IClassificationLabBatchResponse = z.output<typeof ZClassificationLabBatchResponse>

export const ZClassificationLabVersionResponse = z.object({
  model: z.string(),
})
export type IClassificationLabVersionResponse = z.output<typeof ZClassificationLabVersionResponse>

export default {
  zod: ZClassitifationJobsPartners,
  indexes: [
    [{ partner_job_id: 1, partner_label: 1 }, {}],
    [{ human_verification: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
