import { Jsonify } from "type-fest"

import { ADMIN, OPCO, OPCOS, VALIDATION_UTILISATEUR } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"
import { enumToZod } from "./enumToZod"

export enum UserEventType {
  ACTIF = "ACTIF",
  VALIDATION_EMAIL = "VALIDATION_EMAIL",
  DESACTIVE = "DESACTIVE",
}

export const ZValidationUtilisateur = enumToZod(VALIDATION_UTILISATEUR)

export const ZUserStatusEvent = z
  .object({
    validation_type: ZValidationUtilisateur,
    status: enumToZod(UserEventType),
    reason: z.string(),
    granted_by: z.string().nullish(),
    date: z.date(),
  })
  .strict()
export type IUserStatusEvent = z.output<typeof ZUserStatusEvent>
export type IUserStatusEventJson = Jsonify<z.input<typeof ZUserStatusEvent>>

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
    opco: enumToZod(OPCOS),
  }),
  ZUserWithAccountFields.extend({
    type: z.literal(ADMIN),
  }),
])
export type INewSuperUser = z.output<typeof ZNewSuperUser>
