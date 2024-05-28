import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "anonymized_users" as const

export const zAnonymizedUser = z
  .object({
    _id: zObjectId,
    userId: z.string(),
    role: z.string(),
    type: z.string(),
    last_action_date: z.date(),
  })
  .strict()

export type IAnonymizedUser = z.output<typeof zAnonymizedUser>

export default {
  zod: zAnonymizedUser,
  indexes: [],
  collectionName,
} as IModelDescriptor
