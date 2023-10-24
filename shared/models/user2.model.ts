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
    id: zObjectId,
    firstname: z.string(),
    lastname: z.string(),
    phone: extensions.phone(),
    email: z.string().email(),
    last_connection: z.date().nullish(),
    is_anonymized: z.boolean(),
    origin: z.string().nullish(),
    history: z.array(ZUserStatusEvent),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type IUser2 = z.output<typeof ZUser2>
export type IUser2Json = Jsonify<z.input<typeof ZUser2>>

export type IUserStatusEvent = z.output<typeof ZUserStatusEvent>
export type IUserStatusEventJson = Jsonify<z.input<typeof ZUserStatusEvent>>
