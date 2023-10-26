import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { useAuth } from "@/context/UserContext"
import { apiPost } from "@/utils/api.utils"

export default function AuthValidation() {
  const router = useRouter()
  const { setUser } = useAuth()
  const toast = useToast()

  const { token } = router.query as { token: string | undefined }

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        const user = await apiPost("/login/verification", {
          // @ts-expect-error TODO
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        setUser(user)
        router.push("/espace-pro/authentification/validation")
      }
    }
    fetchData().catch(() => {
      toast({
        title: "Votre lien d'authentification a expiré.",
        status: "error",
        isClosable: true,
        duration: 7_000,
        description: " Merci de réessayer de vous connecter",
      })
      router.push("/espace-pro/administration/users")
    })
  }, [token])

  return (
    <Box>
      <Flex justify="center" align="center" h="100vh" direction="column">
        <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
        <Text>Connexion en cours...</Text>
      </Flex>
    </Box>
  )
}
