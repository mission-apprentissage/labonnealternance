import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { validateToken } from "../../api"
import useAuth from "../../common/hooks/useAuth"

export const AuthValidation = () => {
  let navigate = useNavigate()
  const location = useLocation()
  const [, setAuth] = useAuth()

  const { search } = location

  let params = new URLSearchParams(search)
  let token = params.get("token")

  useEffect(() => {
    // send token to back office
    validateToken({ token })
      .then(({ data }) => {
        setAuth(data?.token)
        // KBA 20230712 : Temporary solution until migration : use location href to reload the page to make the JWT token work.
        window.location.href = "espace-pro/authentification/validation"
      })
      .catch(() => {
        navigate("/")
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

export default AuthValidation
