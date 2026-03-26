import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

export const ZEntrepriseManagedByCfa = z
  .object({
    _id: zObjectId,
    createdAt: z.date().describe("Date de création du document dans la collection"),
    updatedAt: z.date().describe("Date de mise à jour du document dans la collection"),
    entreprise_id: zObjectId.describe("_id de la collection entreprises"),
    cfa_id: zObjectId.describe("_id de la collection cfa"),
    last_name: z.string().nullish().describe("Nom du contact"),
    first_name: z.string().nullish().describe("Prenom du contact"),
    phone: z.string().nullish().describe("Téléphone du contact"),
    email: z.string().describe("Email du contact"),
    origin: z.string().nullish().describe("Origine de la creation de l'établissement"),
  })
  .openapi("EntrepriseManagedByCfa")

export type IEntrepriseManagedByCfa = z.output<typeof ZEntrepriseManagedByCfa>

export default {
  zod: ZEntrepriseManagedByCfa,
  indexes: [
    [{ entreprise_id: 1, cfa_id: 1 }, { unique: true }],

    [{ createdAt: 1 }, {}],
    [{ updatedAt: 1 }, {}],
    [{ entreprise_id: 1 }, {}],
    [{ cfa_id: 1 }, {}],
    [{ last_name: 1 }, {}],
    [{ first_name: 1 }, {}],
    [{ phone: 1 }, {}],
    [{ email: 1 }, {}],
    [{ origin: 1 }, {}],
  ],
  collectionName: "entreprise_managed_by_cfa" as const,
} as const satisfies IModelDescriptor
