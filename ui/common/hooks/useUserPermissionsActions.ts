import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"

import useUserHistoryUpdate from "./useUserHistoryUpdate"
import { activateUserRole, deactivateUserRole, notifyNotMyOpcoUserRole } from "@/utils/api"

export const useUserPermissionsActions = (userId: string, organizationId: string, organizationType: AccessEntityType = AccessEntityType.ENTREPRISE) => {
  const update = useUserHistoryUpdate()
  const acceptedTypes = [AccessEntityType.ENTREPRISE, AccessEntityType.CFA]
  if (!acceptedTypes.includes(organizationType)) {
    throw new Error(`organizationType doit être dans ${acceptedTypes.join(", ")}`)
  }
  return {
    activate: async () => update(AccessStatus.GRANTED, () => activateUserRole(userId, organizationId)),
    deactivate: async (reason: string) => update(AccessStatus.DENIED, () => deactivateUserRole(userId, organizationId, reason)),
    waitsForValidation: async (reason: string) => update(AccessStatus.AWAITING_VALIDATION, () => notifyNotMyOpcoUserRole(userId, organizationId, reason)),
  }
}
