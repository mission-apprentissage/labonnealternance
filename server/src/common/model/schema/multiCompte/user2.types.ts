import { Entity } from "../../generic/Entity.js"
import { OPCOS, VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"

export type NewUser = {
  firstname: string
  lastname: string
  phone: string
  email: string
  isAdmin?: boolean
  opco?: OPCOS
}

export enum UserEventType {
  ACTIF = "ACTIF",
  VALIDATION_EMAIL = "VALIDATION_EMAIL",
  INACTIF = "INACTIF",
}

export type NewUserStatusEvent = {
  validation_type: VALIDATION_UTILISATEUR
  status: UserEventType
  reason: string
  grantedBy?: string
}

export type UserStatusEvent = NewUserStatusEvent & {
  date: Date
}

export type User2 = Entity &
  NewUser & {
    lastConnection: Date
    history: UserStatusEvent[]
  }
