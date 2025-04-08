import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "francetravail_access" as const

export type IFranceTravailAccessType = "OFFRE" | "ROMEO"

export const ZFranceTravailAccess = z
  .object({
    _id: zObjectId,
    access_token: z.string(),
    access_type: z.enum(["OFFRE", "ROMEO"]),
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
