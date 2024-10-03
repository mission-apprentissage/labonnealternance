import { Jsonify } from "type-fest"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"
import { ZValidationUtilisateur } from "./userWithAccount.model"

export enum AccessEntityType {
  USER = "USER",
  ENTREPRISE = "ENTREPRISE",
  CFA = "CFA",
  OPCO = "OPCO",
  ADMIN = "ADMIN",
}

export enum AccessStatus {
  GRANTED = "GRANTED",
  DENIED = "DENIED",
  AWAITING_VALIDATION = "AWAITING_VALIDATION",
}

export const ZRoleManagementEvent = z
  .object({
    validation_type: ZValidationUtilisateur.describe("Indique si l'action est ordonnée par un utilisateur ou le serveur"),
    status: extensions.buildEnum(AccessStatus).describe("Statut de l'accès"),
    reason: z.string().describe("Raison du changement de statut"),
    date: z.date().describe("Date de l'évènement"),
    granted_by: z.string().nullish().describe("Utilisateur à l'origine du changement"),
  })
  .strict()

export const ZAccessEntityType = extensions.buildEnum(AccessEntityType)

const collectionName = "rolemanagements" as const

export const ZRoleManagement = z
  .object({
    _id: zObjectId,
    origin: z.string().describe("Origine de la creation"),
    status: z.array(ZRoleManagementEvent).describe("Evénements liés au cycle de vie de l'accès"),
    authorized_id: z.string().describe("ID de l'entité sur laquelle l'accès est exercé"),
    authorized_type: ZAccessEntityType.describe("Type de l'entité sur laquelle l'accès est exercé"),
    user_id: zObjectId.describe("ID de l'utilisateur ayant accès"),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type IRoleManagement = z.output<typeof ZRoleManagement>
export type IRoleManagementJson = Jsonify<z.input<typeof ZRoleManagement>>
export type IRoleManagementEvent = z.output<typeof ZRoleManagementEvent>

export default {
  zod: ZRoleManagement,
  indexes: [
    [{ authorized_id: 1 }, {}],
    [{ authorized_type: 1 }, {}],
    [{ user_id: 1 }, {}],
    [{ user_id: 1, authorized_id: 1, authorized_type: 1 }, { unique: true }],
    [{ "status.date": 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
