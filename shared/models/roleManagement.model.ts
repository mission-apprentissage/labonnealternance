import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"
import { enumToZod } from "./enumToZod"
import { ZValidationUtilisateur } from "./user2.model.js"

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
    validation_type: ZValidationUtilisateur,
    status: enumToZod(AccessStatus),
    reason: z.string(),
    date: z.date(),
    granted_by: z.string().nullish(),
  })
  .strict()

export const ZAccessEntityType = enumToZod(AccessEntityType)

export const ZRoleManagement = z
  .object({
    accessor_id: zObjectId,
    accessor_type: ZAccessEntityType,
    accessed_id: z.string(),
    accessed_type: ZAccessEntityType,
    origin: z.string(),
    history: z.array(ZRoleManagementEvent),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type IRoleManagement = z.output<typeof ZRoleManagement>

export type IRoleManagementEvent = z.output<typeof ZRoleManagementEvent>
