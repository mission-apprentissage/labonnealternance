import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "applicants" as const

export const ZApplicant = z
  .object({
    _id: zObjectId,
    lastname: z.string(),
    firstname: z.string(),
    email: z.string().email(),
    phone: extensions.telephone,
    last_connection: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type IApplicant = z.output<typeof ZApplicant>

export default {
  zod: ZApplicant,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
