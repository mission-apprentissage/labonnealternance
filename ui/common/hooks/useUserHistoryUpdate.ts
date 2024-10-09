import { useToast } from "@chakra-ui/react"
import { useCallback } from "react"
import { useQueryClient } from "react-query"
import { assertUnreachable } from "shared"
import { AccessStatus } from "shared/models/roleManagement.model"

import { updateUserValidationHistory } from "../../utils/api"

export default function useUserHistoryUpdate() {
  const client = useQueryClient()
  const toast = useToast()

  return useCallback(
    async (props: Parameters<typeof updateUserValidationHistory>[0]) => {
      await updateUserValidationHistory(props)
        .then(() => ["user-list-opco", "user-list"].map((x) => client.invalidateQueries(x)))
        .then(() => {
          const newStatus = props.status
          toast({
            description: `Utilisateur ${getDescription(newStatus)}`,
            position: "top-right",
            status: "success",
            duration: 4000,
            isClosable: true,
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
