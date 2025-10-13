import { ObjectId } from "bson"
import { AccessEntityType, AccessStatus } from "shared"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"

import { modifyPermissionToUser } from "@/services/roleManagement.service"

export const up = async () => {
  await modifyPermissionToUser(
    { user_id: new ObjectId("66cf3d021800103664b94994"), authorized_type: AccessEntityType.ENTREPRISE, authorized_id: "66cf3ca4baf516ceba755752", origin: "lba" },
    { reason: "désynchronisation de désactivation avec l'entreprise, constaté le 9/10/2025", status: AccessStatus.DENIED, validation_type: VALIDATION_UTILISATEUR.MANUAL }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
