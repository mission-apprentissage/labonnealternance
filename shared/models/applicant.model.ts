import { removeUrlsFromText } from "../helpers/common"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "applicants" as const

export const ZApplicant = z
  .object({
    _id: zObjectId,
    firstname: z.string().min(1).transform(removeUrlsFromText).describe("Prenom du candidat"),
    lastname: z.string().min(1).transform(removeUrlsFromText).describe("Nom du candidat"),
    email: z.string().email().describe("Email du candidat"),
    phone: extensions.telephone.describe("Téléphone du candidat"),
    last_connection: z.date().describe("Date de dernière connexion du candidat"),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
export type IApplicant = z.output<typeof ZApplicant>

export const ZApplicantNew = ZApplicant.omit({
  _id: true,
  last_connection: true,
  createdAt: true,
  updatedAt: true,
})
export type IApplicantNew = z.output<typeof ZApplicantNew>

export default {
  zod: ZApplicant,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
