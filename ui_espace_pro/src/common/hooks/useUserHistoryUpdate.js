import { useToast } from "@chakra-ui/react"
import { useCallback } from "react"
import { useQueryClient } from "react-query"
import { updateUserValidationHistory } from "../../api"
import useAuth from "./useAuth"

export default function useUserHistoryUpdate(userId, statut, motif = undefined) {
  const [auth] = useAuth()
  const client = useQueryClient()
  const toast = useToast()

  return useCallback(() => {
    updateUserValidationHistory(userId, {
      validation_type: "MANUELLE",
      user: auth.id,
      statut: statut,
      motif,
    })
      .then(() => ["awaitingValidationUserList", "activeUserList", "disableUserList", "user"].map((x) => client.invalidateQueries(x)))
      .then(() =>
        toast({
          description: `Utilisateur ${statut}`,
          position: "top-right",
          status: "success",
          duration: 4000,
          isClosable: true,
        })
      )
  })
}
