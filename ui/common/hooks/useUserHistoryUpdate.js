import { useToast } from "@chakra-ui/react"
import { useCallback } from "react"
import { useQueryClient } from "react-query"

import { updateUserValidationHistory } from "../../utils/api"

import useAuth from "./useAuth"

export default function useUserHistoryUpdate(userId, status, reason = undefined) {
  const [auth] = useAuth()
  const client = useQueryClient()
  const toast = useToast()

  return useCallback(async () => {
    await updateUserValidationHistory(userId, {
      validation_type: "MANUELLE",
      user: auth.id,
      status,
      reason,
    })
      .then(() => ["errorUserList", "awaitingValidationUserList", "activeUserList", "disableUserList", "user"].map((x) => client.invalidateQueries(x)))
      .then(() =>
        toast({
          description: `Utilisateur ${status}`,
          position: "top-right",
          status: "success",
          duration: 4000,
          isClosable: true,
        })
      )
  }, [auth.id, client, reason, status, toast, userId])
}
