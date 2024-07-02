import Boom from "boom"
import { ObjectId } from "mongodb"
import { assertUnreachable } from "shared"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUserWithAccount, UserEventType } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const controlUserState = async (user: IUserWithAccount): Promise<{ error: boolean; reason?: string }> => {
  const status = getLastStatusEvent(user.status)?.status
  switch (status) {
    case UserEventType.DESACTIVE:
      return { error: true, reason: "DISABLED" }
    case UserEventType.VALIDATION_EMAIL:
    case UserEventType.ACTIF: {
      const roles = await getDbCollection("rolemanagements").find({ user_id: user._id }).toArray()
      const rolesWithAccess = roles.filter((role) => getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED)
      const cfaOpcoOrAdminRoles = rolesWithAccess.filter((role) => [AccessEntityType.ADMIN, AccessEntityType.OPCO, AccessEntityType.CFA].includes(role.authorized_type))
      if (cfaOpcoOrAdminRoles.length) {
        return { error: false }
      }
      const entrepriseRoles = rolesWithAccess.filter((role) => role.authorized_type === AccessEntityType.ENTREPRISE)
      if (entrepriseRoles.length) {
        const entreprises = await getDbCollection("entreprises")
          .find({ _id: { $in: entrepriseRoles.map((role) => new ObjectId(role.authorized_id.toString())) } })
          .toArray()
        const hasSomeEntrepriseReady = entreprises.find((entreprise) => getLastStatusEvent(entreprise.status)?.status === EntrepriseStatus.VALIDE)
        if (hasSomeEntrepriseReady) {
          return { error: false }
        }
      }
      return { error: true, reason: "VALIDATION" }
    }
    case null:
    case undefined:
      throw Boom.badRequest("L'état utilisateur est inconnu")

    default:
      assertUnreachable(status)
  }
}
