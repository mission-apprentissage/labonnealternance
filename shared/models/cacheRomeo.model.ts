import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "cache_romeo" as const

const ZMetiersRomeRomeo = z.object({
  codeAppellation: z.string(),
  codeRome: z.string(),
  libelleAppellation: z.string(),
  libelleRome: z.string(),
  scorePrediction: z.number(),
})

export const ZRomeo = z.object({
  _id: zObjectId,
  contexte: z.string(),
  identifiant: z.string(),
  intitule: z.string(),
  uuidInference: z.string(),
  metiersRome: z.array(ZMetiersRomeRomeo),
})

export const ZRomeoApiResponse = z.array(ZRomeo.omit({ _id: true }))
export type IRomeoApiResponse = z.output<typeof ZRomeoApiResponse>

export default {
  zod: ZRomeo,
  indexes: [[{ intitule: "text" }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
