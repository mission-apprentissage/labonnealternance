import { z } from "zod"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "recruteurslbalegacies" as const

export const ZLbaCompanyLegacy = z
  .object({
    _id: zObjectId,
    siret: z.string().describe("Le Siret de la société"),
    email: z.string().nullable().describe("Adresse email de contact"),
  })
  .strict()

export type ILbaCompanyLegacy = z.output<typeof ZLbaCompanyLegacy>

export default {
  zod: ZLbaCompanyLegacy,
  indexes: [
    [{ siret: 1 }, {}],
    [{ siret: 1, email: 1 }, { unique: true }],
  ],
  collectionName,
} as const satisfies IModelDescriptor
