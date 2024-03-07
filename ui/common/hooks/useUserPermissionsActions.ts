import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"

import { updateUserValidationHistory } from "@/utils/api"

import useUserHistoryUpdate from "./useUserHistoryUpdate"

type UpdateProps = Parameters<typeof updateUserValidationHistory>[0]

export const useUserPermissionsActions = (
  userId: UpdateProps["userId"],
  organizationId: UpdateProps["organizationId"] = userId, // TODO not passed and not processed by API. It should be a valid ObjectId since it is still validated by zod.
  organizationType: AccessEntityType = AccessEntityType.ENTREPRISE // TODO not passed and not processed by API
) => {
  const update = useUserHistoryUpdate()
  const acceptedTypes = [AccessEntityType.ENTREPRISE, AccessEntityType.CFA]
  if (!acceptedTypes.includes(organizationType)) {
    throw new Error(`organizationType doit être dans ${acceptedTypes.join(", ")}`)
  }
  const checkedType = organizationType as typeof AccessEntityType.ENTREPRISE | typeof AccessEntityType.CFA
  return {
    activate: (reason = "") =>
      update({
        userId,
        organizationId,
        organizationType: checkedType,
        status: AccessStatus.GRANTED,
        reason,
      }),

    deactivate: (reason: string) =>
      update({
        userId,
        organizationId,
        organizationType: checkedType,
        status: AccessStatus.DENIED,
        reason,
      }),
    waitsForValidation: (reason: string) =>
      update({
        userId,
        organizationId,
        organizationType: checkedType,
        status: AccessStatus.AWAITING_VALIDATION,
        reason,
      }),
  }
}
