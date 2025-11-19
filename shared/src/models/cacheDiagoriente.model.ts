import { z } from "zod"
import { zObjectId } from "zod-mongodb-schema"

import type { IModelDescriptor } from "./common.js"

const collectionName = "cache_diagoriente" as const

export const ZDiagorienteClassificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  sector: z.string(),
  description: z.string(),
})
export type IDiagorienteClassificationSchema = z.output<typeof ZDiagorienteClassificationSchema>

export const ZDiagorienteClassificationResponseSchema = z.record(
  z.object({
    classify_results: z.array(
      z.object({
        data: z.object({
          _key: z.string(),
          item_version_id: z.string(),
          item_id: z.string(),
          titre: z.string(),
          valid_from: z.string(),
          valid_to: z.string().nullable(),
          item_type: z.string(),
          rome: z.string(),
        }),
      })
    ),
  })
)
export type IDiagorienteClassificationResponseSchema = z.output<typeof ZDiagorienteClassificationResponseSchema>

const ZCacheDiagoriente = z
  .object({
    _id: zObjectId,
  })
  .extend({
    ...ZDiagorienteClassificationSchema.pick({ title: true, sector: true }).shape,
    ...ZDiagorienteClassificationResponseSchema.omit({ job_offer_id: true }).shape,
  })

export type ICacheDiagoriente = z.output<typeof ZCacheDiagoriente>

export default {
  zod: ZCacheDiagoriente,
  indexes: [[{ title: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
