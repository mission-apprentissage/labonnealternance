import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "francetravaill_access" as const

export const ZFranceTravailAccess = z
  .object({
    _id: zObjectId,
    access_token: z.string(),
    access_type: z.enum(["OFFRE", "ROME", "ROMEV4"]),
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
