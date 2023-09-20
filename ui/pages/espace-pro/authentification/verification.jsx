import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import useAuth from "../../../common/hooks/useAuth"
import { validateToken } from "../../../utils/api"

export default function AuthValidation() {
  const router = useRouter()
  const [, setAuth] = useAuth()

  const { token } = router.query

  useEffect(() => {
    if (token) {
      // send token to back office
      validateToken({ token })
        .then(({ data }) => {
          setAuth(data?.token)
          // KBA 20230712 : Temporary solution until migration : use location href to reload the page to make the JWT token work.
          // window.location.href = "espace-pro/authentification/validation"
          // TODO AB
          router.push("/espace-pro/authentification/validation")
        })
        .catch(() => {
          router.push("/")
        })
    }
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
