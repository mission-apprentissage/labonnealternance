import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { useAuth } from "@/context/UserContext"
import { apiPost } from "@/utils/api.utils"

export default function AuthValidation() {
  const router = useRouter()
  const { setUser } = useAuth()

  const { token } = router.query as { token: string | undefined }

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        const user = await apiPost("/login/verification", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        setUser(user)
        router.push("/espace-pro/authentification/validation")
      }
    }
    fetchData().catch(() => {
      router.push("/")
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
