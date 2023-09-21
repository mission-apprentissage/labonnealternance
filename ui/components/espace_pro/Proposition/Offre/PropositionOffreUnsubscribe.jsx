import { Box, Flex, Spinner, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { useQuery } from "react-query"

import { etablissementUnsubscribeDemandeDelegation } from "../../../../utils/api"

export const PropositionOffreUnsubscribe = () => {
  const router = useRouter()
  const { siretFormateur } = router.query
  const toast = useToast()
  const { isLoading, isError, isSuccess } = useQuery("proposition-offre-unsubscribe", async () => {
    if (!siretFormateur) return
    await etablissementUnsubscribeDemandeDelegation(siretFormateur)
  })
  useEffect(() => {
    if (isError) {
      toast({
        title: "Une erreur est survenue.",
        position: "top",
        status: "error",
        isClosable: false,
        duration: 5000,
      })
    } else if (isSuccess) {
      toast({
        title: "Désinscription réussie",
        position: "top",
        status: "success",
        isClosable: true,
        duration: 5000,
      })
    }
  }, [isError, isLoading, isSuccess, toast])
  if (!siretFormateur) {
    throw new Error("unexpected: siretFormateur not found")
  }

  return (
    <Box>
      {isLoading && (
        <Flex justify="center" align="center" h="100vh" direction="column">
          <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
        </Flex>
      )}
    </Box>
  )
}

export default PropositionOffreUnsubscribe
