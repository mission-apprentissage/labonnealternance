import { z } from "zod"
import { zObjectId } from "zod-mongodb-schema"

import { IModelDescriptor } from "./common.js"

const collectionName = "cache_diagoriente" as const

export const ZDiagorienteClassificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  sector: z.string(),
  description: z.string(),
})
export type IDiagorienteClassificationSchema = z.output<typeof ZDiagorienteClassificationSchema>

export const ZDiagorienteClassificationResponseSchema = z.object({
  job_offer_id: z.string(),
  code_rome: z.string(),
  intitule_rome: z.string(),
})
export type IDiagorienteClassificationResponseSchema = z.output<typeof ZDiagorienteClassificationResponseSchema>

const ZCacheDiagoriente = z
  .object({
    _id: zObjectId,
  })
  .extend({
    ...ZDiagorienteClassificationSchema.pick({ title: true, sector: true }).shape,
    ...ZDiagorienteClassificationResponseSchema.omit({ job_offer_id: true }).shape,
  })

export default {
  zod: ZCacheDiagoriente,
  indexes: [[{ title: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
