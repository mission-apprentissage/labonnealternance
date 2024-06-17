import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "credentials" as const

export const ZCredential = z
  .object({
    _id: zObjectId,
    nom: z.string(),
    prenom: z.string(),
    organisation: z.string(),
    scope: z.string(),
    email: z.string().email(),
    api_key: z.string(),
    actif: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type ICredential = z.output<typeof ZCredential>

export default {
  zod: ZCredential,
  indexes: [[{ api_key: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
