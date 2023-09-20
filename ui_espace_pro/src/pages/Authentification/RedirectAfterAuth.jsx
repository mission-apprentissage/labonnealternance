import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"

export function RedirectAfterAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [auth] = useAuth()

  const fromEntrepriseCreation = location.state

  useEffect(() => {
    if (auth.sub === "anonymous") return

    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        setTimeout(() => {
          navigate(`/administration/entreprise/${auth.establishment_id}`, {
            state: { offerPopup: fromEntrepriseCreation ? true : false },
          })
        }, 1000)
        break

      case AUTHTYPE.OPCO:
        setTimeout(() => {
          navigate(`/administration/opco`, { replace: true })
        }, 1000)
        break

      case AUTHTYPE.CFA:
        setTimeout(() => {
          navigate("/administration")
        }, 1000)
        break

      case AUTHTYPE.ADMIN:
        setTimeout(() => {
          navigate("/administration/users")
        }, 1000)
        break

      default:
        break
    }
  }, [auth])

  return (
    <>
      <Box>
        <Flex justify="center" align="center" h="100vh" direction="column">
          <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
          <Text>Authentification en cours...</Text>
        </Flex>
      </Box>
    </>
  )
}

export default RedirectAfterAuth
