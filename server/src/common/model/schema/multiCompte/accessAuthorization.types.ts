import { VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { Entity } from "../../../../common/model/generic/Entity.js"

export enum AccessEntityType {
  USER = "USER",
  ENTREPRISE = "ENTREPRISE",
  CFA = "CFA",
}

export enum AccessStatus {
  GRANTED = "GRANTED",
  DENIED = "DENIED",
  AWAITING_VALIDATION = "AWAITING_VALIDATION",
}

export type NewAccessAuthorizationEvent = {
  validation_type: VALIDATION_UTILISATEUR
  status: AccessStatus
  reason: string
  granted_by?: string
}

export type AccessAuthorizationEvent = NewAccessAuthorizationEvent & {
  date: Date
}

type AccessAuthorizationBase = {
  accessor_id: string
  accessor_type: AccessEntityType
  accessed_id: string
  accessed_type: AccessEntityType
}

export type AccessAuthorization = Entity &
  AccessAuthorizationBase & {
    history: AccessAuthorizationEvent[]
  }

export type NewAccessAuthorization = AccessAuthorizationBase & NewAccessAuthorizationEvent
