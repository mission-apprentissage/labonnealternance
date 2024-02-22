import { Jsonify } from "type-fest"

import { VALIDATION_UTILISATEUR } from "../constants/recruteur"
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

export const ZUser2 = z
  .object({
    _id: zObjectId,
    origin: z.string().nullish(),
    status: z.array(ZUserStatusEvent),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
    phone: extensions.phone(),
    last_action_date: z.date().nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type IUser2 = z.output<typeof ZUser2>
export type IUser2Json = Jsonify<z.input<typeof ZUser2>>

export type IUserStatusEvent = z.output<typeof ZUserStatusEvent>
export type IUserStatusEventJson = Jsonify<z.input<typeof ZUserStatusEvent>>
