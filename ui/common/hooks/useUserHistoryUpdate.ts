import { useToast } from "@chakra-ui/react"
import { useCallback } from "react"
import { useQueryClient } from "react-query"

import { useAuth } from "@/context/UserContext"

import { updateUserValidationHistory } from "../../utils/api"

export default function useUserHistoryUpdate(userId, status, reason = undefined) {
  const { user } = useAuth()
  const client = useQueryClient()
  const toast = useToast()

  return useCallback(async () => {
    await updateUserValidationHistory(userId, {
      validation_type: "MANUELLE",
      user: user._id,
      status,
      reason,
    })
      .then(() => ["user-list-opco", "user-list", "user"].map((x) => client.invalidateQueries(x)))
      .then(() =>
        toast({
          description: `Utilisateur ${status}`,
          position: "top-right",
          status: "success",
          duration: 4000,
          isClosable: true,
        })
      )
  }, [user._id, client, reason, status, toast, userId])
}
