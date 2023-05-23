import { useToast } from "@chakra-ui/react"
import { useCallback } from "react"
import { useQueryClient } from "react-query"
import { updateUserValidationHistory } from "../../api"
import useAuth from "./useAuth"

export default function useUserHistoryUpdate(userId, status, reason = undefined) {
  const [auth] = useAuth()
  const client = useQueryClient()
  const toast = useToast()

  return useCallback(() => {
    updateUserValidationHistory(userId, {
      validation_type: "MANUELLE",
      user: auth.id,
      status,
      reason,
    })
      .then(() => ["awaitingValidationUserList", "activeUserList", "disableUserList", "user"].map((x) => client.invalidateQueries(x)))
      .then(() =>
        toast({
          description: `Utilisateur ${status}`,
          position: "top-right",
          status: "success",
          duration: 4000,
          isClosable: true,
        })
      )
  })
}
