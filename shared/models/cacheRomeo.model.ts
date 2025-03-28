import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "cache_romeo" as const

const ZMetiersRomeRomeo = z.object({
  codeAppellation: z.string(),
  codeRome: z.string(),
  libelleAppellation: z.string(),
  libelleRome: z.string(),
  scorePrediction: z.number(),
})

export const ZRomeoModel = z.object({
  contexte: z.string().nullish(),
  identifiant: z.string(),
  intitule: z.string(),
  metiersRome: z.array(ZMetiersRomeRomeo),
})

export const ZRomeoAPIResponse = z.array(ZRomeoModel)
export type IRomeoAPIResponse = z.output<typeof ZRomeoAPIResponse>
export type IRomeoAPIModel = z.output<typeof ZRomeoModel>

export const ZCacheRomeo = z
  .object({
    _id: zObjectId,
  })
  .extend({
    ...ZRomeoModel.omit({
      identifiant: true,
    }).shape,
  })
export type ICacheRomeo = z.output<typeof ZCacheRomeo>

export default {
  zod: ZCacheRomeo,
  indexes: [[{ intitule: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
