import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { validateOptOutToken } from "../../api"
import { AUTHTYPE } from "../../common/contants"

export default () => {
  let navigate = useNavigate()
  const location = useLocation()

  const { search } = location

  let params = new URLSearchParams(search)
  let token = params.get("token")
  const toast = useToast()

  useEffect(() => {
    if (!token) {
      navigate("/")
    }

    // send token to back office
    validateOptOutToken(token)
      .then(({ data }) => {
        navigate("/creation/detail", { state: { informationSiret: data, type: AUTHTYPE.CFA, origine: "optout" } })
      })
      .catch(({ response }) => {
        switch (response.data.reason) {
          case "TOKEN_NOT_FOUND":
            toast({
              title: "Le lien est invalide ou a expiré.",
              description: "Merci de prendre contact avec le support.",
              position: "top-right",
              status: "success",
              duration: 5000,
            })
            break

          case "USER_NOT_FOUND":
            toast({
              title: "L'utilisateur n'a pas été trouvé dans notre base.",
              description: "Merci de prendre contact avec le support.",
              position: "top-right",
              status: "success",
              duration: 5000,
            })
            break

          default:
            break
        }
        navigate("/")
      })
  }, [token])

  return (
    <Box>
      <Flex justify="center" align="center" h="100vh" direction="column">
        <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
        <Text>Vérification en cours...</Text>
      </Flex>
    </Box>
  )
}
