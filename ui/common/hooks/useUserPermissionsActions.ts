import { AccessStatus } from "shared/models/roleManagement.model"

import { updateUserValidationHistory } from "@/utils/api"

import useUserHistoryUpdate from "./useUserHistoryUpdate"

type UpdateProps = Parameters<typeof updateUserValidationHistory>[0]

export const useUserPermissionsActions = (userId: UpdateProps["userId"], organizationId: UpdateProps["organizationId"], organizationType: UpdateProps["organizationType"]) => {
  const update = useUserHistoryUpdate()
  return {
    activate: (reason = "") =>
      update({
        userId,
        organizationId,
        organizationType,
        status: AccessStatus.GRANTED,
        reason,
      }),

    deactivate: (reason: string) =>
      update({
        userId,
        organizationId,
        organizationType,
        status: AccessStatus.DENIED,
        reason,
      }),
    waitsForValidation: (reason: string) =>
      update({
        userId,
        organizationId,
        organizationType,
        status: AccessStatus.AWAITING_VALIDATION,
        reason,
      }),
  }
}
