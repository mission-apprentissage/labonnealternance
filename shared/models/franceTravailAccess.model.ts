import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "francetravail_access" as const

export const ZFranceTravailAccessType = z.enum(["OFFRE", "ROMEO", "ROME"])
export type IFranceTravailAccessType = z.output<typeof ZFranceTravailAccessType>

export const ZFranceTravailAccess = z
  .object({
    _id: zObjectId,
    access_token: z.string(),
    access_type: ZFranceTravailAccessType,
    created_at: z.date(),
  })
  .strict()
export type IFranceTravailAccess = z.output<typeof ZFranceTravailAccess>

export default {
  zod: ZFranceTravailAccess,
  indexes: [
    [{ created_at: 1 }, { expireAfterSeconds: 1499 }],
    [{ access_type: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
