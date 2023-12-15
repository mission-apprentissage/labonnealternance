import { IUserRecruteur } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import { getUserStatus } from "./userRecruteur.service"

export const controlUserState = (status: IUserRecruteur["status"]): { error: boolean; reason: string } | undefined => {
  const currentState = getUserStatus(status)
  if (!currentState || [ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.ERROR].includes(currentState)) {
    return { error: true, reason: "VALIDATION" }
  }
  if (currentState === ETAT_UTILISATEUR.DESACTIVE) {
    return { error: true, reason: "DISABLED" }
  }
}
