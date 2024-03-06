import { useToast } from "@chakra-ui/react"
import { useCallback } from "react"
import { useQueryClient } from "react-query"

import { updateUserValidationHistory } from "../../utils/api"

export default function useUserHistoryUpdate(props: Parameters<typeof updateUserValidationHistory>[0]) {
  const client = useQueryClient()
  const toast = useToast()

  return useCallback(async () => {
    await updateUserValidationHistory(props)
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
  }, [client, toast, ...Object.values(props)])
}
