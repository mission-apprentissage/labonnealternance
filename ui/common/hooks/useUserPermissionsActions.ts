import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"

import { activateUserRole, deactivateUserRole, notifyNotMyOpcoUserRole } from "@/utils/api"

import useUserHistoryUpdate from "./useUserHistoryUpdate"

export const useUserPermissionsActions = (
  userId: string,
  organizationId: string = userId, // TODO not passed and not processed by API. It should be a valid ObjectId since it is still validated by zod.
  organizationType: AccessEntityType = AccessEntityType.ENTREPRISE // TODO not passed and not processed by API
) => {
  const update = useUserHistoryUpdate()
  const acceptedTypes = [AccessEntityType.ENTREPRISE, AccessEntityType.CFA]
  if (!acceptedTypes.includes(organizationType)) {
    throw new Error(`organizationType doit être dans ${acceptedTypes.join(", ")}`)
  }
  return {
    activate: () => update(AccessStatus.GRANTED, () => activateUserRole(userId, organizationId)),
    deactivate: (reason: string) => update(AccessStatus.DENIED, () => deactivateUserRole(userId, organizationId, reason)),
    waitsForValidation: (reason: string) => update(AccessStatus.AWAITING_VALIDATION, () => notifyNotMyOpcoUserRole(userId, organizationId, reason)),
  }
}
