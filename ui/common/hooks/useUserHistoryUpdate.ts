import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { assertUnreachable } from "shared"
import { AccessStatus } from "shared/models/roleManagement.model"

import { useToast } from "@/app/hooks/useToast"

export default function useUserHistoryUpdate() {
  const client = useQueryClient()
  const toast = useToast()

  return useCallback(
    async (status: AccessStatus, apiCall: () => Promise<unknown>) => {
      await apiCall()
        .then(() =>
          ["user-list-opco", "user-list"].map(async (x) =>
            client.invalidateQueries({
              queryKey: [x],
            })
          )
        )
        .then(() => {
          toast({
            description: `Utilisateur ${getDescription(status)}`,
            autoHideDuration: 4000,
          })
        })
    },
    [client, toast]
  )
}

const getDescription = (status: AccessStatus): string => {
  switch (status) {
    case AccessStatus.GRANTED:
      return "validé"
    case AccessStatus.DENIED:
      return "désactivé"
    case AccessStatus.AWAITING_VALIDATION:
      return "en attente de validation"
    default:
      assertUnreachable(status)
  }
}
