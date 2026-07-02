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
      try {
        await apiCall()
        await Promise.all(["user-list-opco", "user-list"].map((x) => client.invalidateQueries({ queryKey: [x] })))
        toast({
          description: `Utilisateur ${getDescription(status)}`,
          autoHideDuration: 4000,
        })
      } catch (error) {
        toast({
          variant: "error",
          description: error instanceof Error ? error.message : "Une erreur est survenue",
          autoHideDuration: 5000,
        })
      }
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
