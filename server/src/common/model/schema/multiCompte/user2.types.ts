import { Entity } from "../../generic/Entity.js"
import { OPCOS, VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"

export type NewUser = {
  firstname: string
  lastname: string
  phone: string
  email: string
  is_admin?: boolean
  opco?: OPCOS
}

export enum UserEventType {
  ACTIF = "ACTIF",
  VALIDATION_EMAIL = "VALIDATION_EMAIL",
  DESACTIVE = "DESACTIVE",
}

export type NewUserStatusEvent = {
  validation_type: VALIDATION_UTILISATEUR
  status: UserEventType
  reason: string
  granted_by?: string
}

export type UserStatusEvent = NewUserStatusEvent & {
  date: Date
}

export type User2 = Entity &
  NewUser & {
    last_connection: Date
    history: UserStatusEvent[]
    is_anonymized: boolean
    origin: string
  }
