import { z } from "zod"

import { zObjectId } from "./common"

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
