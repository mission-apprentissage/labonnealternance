import { Jsonify } from "type-fest"

import { ADMIN, OPCO, OPCOS_LABEL, VALIDATION_UTILISATEUR } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

export enum UserEventType {
  ACTIF = "ACTIF",
  VALIDATION_EMAIL = "VALIDATION_EMAIL",
  DESACTIVE = "DESACTIVE",
}

export const ZValidationUtilisateur = extensions.buildEnum(VALIDATION_UTILISATEUR)

export const ZUserStatusEvent = z
  .object({
    validation_type: ZValidationUtilisateur,
    status: extensions.buildEnum(UserEventType),
    reason: z.string(),
    granted_by: z.string().nullish(),
    date: z.date(),
  })
  .strict()
export type IUserStatusEvent = z.output<typeof ZUserStatusEvent>
export type IUserStatusEventJson = Jsonify<z.input<typeof ZUserStatusEvent>>

const collectionName = "userswithaccounts" as const

export const ZUserWithAccount = z
  .object({
    _id: zObjectId,
    origin: z.string().nullish(),
    status: z.array(ZUserStatusEvent),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone: extensions.phone(),
    last_action_date: z.date().nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
export type IUserWithAccount = z.output<typeof ZUserWithAccount>
export type IUserWithAccountJson = Jsonify<z.input<typeof ZUserWithAccount>>

export const ZUserWithAccountFields = ZUserWithAccount.pick({
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
})
export type IUserWithAccountFields = z.output<typeof ZUserWithAccountFields>

export const ZNewSuperUser = z.union([
  ZUserWithAccountFields.extend({
    type: z.literal(OPCO),
    opco: extensions.buildEnum(OPCOS_LABEL),
  }),
  ZUserWithAccountFields.extend({
    type: z.literal(ADMIN),
  }),
])
export type INewSuperUser = z.output<typeof ZNewSuperUser>

export default {
  zod: ZUserWithAccount,
  indexes: [
    [{ email: 1 }, { unique: true }],
    [{ last_action_date: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
