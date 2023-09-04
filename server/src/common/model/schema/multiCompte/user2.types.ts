import { Entity } from "../../generic/Entity.js"

export type NewUser = {
  firstname: string
  lastname: string
  phone: string
  email: string
}

export type User2 = Entity &
  NewUser & {
    hasUserValidatedEmail: boolean
    lastConnection: Date
  }
