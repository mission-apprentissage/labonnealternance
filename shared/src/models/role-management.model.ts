import type { Jsonify } from "type-fest"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"
import { HANDI_ENGAGEMENT_VALUES } from "./referentiel-engagement-entreprise.model.js"
import { ZValidationUtilisateur } from "./user-with-account.model.js"

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

export const ZRoleManagementEvent = z.strictObject({
  validation_type: ZValidationUtilisateur.describe("Indique si l'action est ordonnée par un utilisateur ou le serveur"),
  status: extensions.buildEnum(AccessStatus).describe("Statut de l'accès"),
  reason: z.string().describe("Raison du changement de statut"),
  date: z.date().describe("Date de l'évènement"),
  granted_by: z.string().nullish().describe("Utilisateur à l'origine du changement"),
})

export const ZAccessEntityType = extensions.buildEnum(AccessEntityType)

const collectionName = "rolemanagements" as const

export const ZRoleManagement = z.strictObject({
  _id: zObjectId,
  status: z.array(ZRoleManagementEvent).describe("Evénements liés au cycle de vie de l'accès"),
  authorized_id: z.string().describe("ID de l'entité sur laquelle l'accès est exercé"),
  authorized_type: ZAccessEntityType.describe("Type de l'entité sur laquelle l'accès est exercé"),
  user_id: zObjectId.describe("ID de l'utilisateur ayant accès"),
  createdAt: z.date(),
  updatedAt: z.date(),
  handiEngagement: z
    .enum(HANDI_ENGAGEMENT_VALUES)
    .nullish()
    .describe("Choix (ENTREPRISE) déclaré à la création du compte de valoriser l'engagement handicap referentiel_engagement_entreprise"),
})

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
    [{ "status.status": 1 }, {}],
    [{ "status.date": 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
