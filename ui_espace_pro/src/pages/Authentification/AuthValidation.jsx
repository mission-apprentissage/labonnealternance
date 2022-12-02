import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { validateToken } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"

export default () => {
  let navigate = useNavigate()
  const location = useLocation()
  const [auth, setAuth] = useAuth()

  const { search } = location
  const fromEntrepriseCreation = location.state

  let params = new URLSearchParams(search)
  let token = params.get("token")

  useEffect(() => {
    // if (!token) {
    //   navigate('/')
    // }

    // send token to back office
    validateToken({ token })
      .then(({ data }) => {
        setAuth(data?.token)
      })
      .catch(() => {
        navigate("/")
      })
  }, [token])

  useEffect(() => {
    // if (auth.sub !== 'anonymous') {
    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        setTimeout(() => {
          navigate(`/administration/entreprise/${auth.id_form}`, {
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
    // }
  }, [auth])

  return (
    <>
      <Box>
        <Flex justify="center" align="center" h="100vh" direction="column">
          <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
          <Text>Connexion en cours...</Text>
        </Flex>
      </Box>
    </>
  )
}
