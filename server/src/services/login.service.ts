import Boom from "boom"
import { IUserRecruteur, assertUnreachable } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import { getUserStatus } from "./userRecruteur.service"

export const controlUserState = (status: IUserRecruteur["status"]): { error: boolean; reason?: string } => {
  const currentState = getUserStatus(status)
  switch (currentState) {
    case ETAT_UTILISATEUR.ATTENTE:
    case ETAT_UTILISATEUR.ERROR:
      return { error: true, reason: "VALIDATION" }

    case ETAT_UTILISATEUR.DESACTIVE:
      return { error: true, reason: "DISABLED" }

    case ETAT_UTILISATEUR.VALIDE:
      return { error: false }

    case null:
    case undefined:
      throw Boom.badRequest("L'état utilisateur est inconnu")

    default:
      assertUnreachable(currentState)
  }
}
