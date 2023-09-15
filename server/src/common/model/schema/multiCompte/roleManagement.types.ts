import { VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { Entity } from "../../generic/Entity.js"

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

export type NewRoleManagementEvent = {
  validation_type: VALIDATION_UTILISATEUR
  status: AccessStatus
  reason: string
  granted_by?: string
}

export type RoleManagementEvent = NewRoleManagementEvent & {
  date: Date
}

type RoleManagementBase = {
  accessor_id: string
  accessor_type: AccessEntityType
  accessed_id: string
  accessed_type: AccessEntityType
  origin: string
}

export type RoleManagement = Entity &
  RoleManagementBase & {
    history: RoleManagementEvent[]
  }

export type NewRoleManagement = RoleManagementBase & NewRoleManagementEvent
