import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { AUTHTYPE } from "../../../common/contants"
import { validateOptOutToken } from "../../../utils/api"

export default function OptOutValidation() {
  const toast = useToast()
  const router = useRouter()
  // TODO_AB
  // const location = useLocation()

  // const { search } = location

  // let params = new URLSearchParams(search)
  // let token = params.get("token")
  const { token } = router.query

  useEffect(() => {
    if (!token) {
      router.push("/espace-pro/")
    }

    // send token to back office
    validateOptOutToken(token)
      .then(({ data }) => {
        // TODO_AB
        // router.push("/espace-pro/creation/detail", { state: { informationSiret: data, type: AUTHTYPE.CFA, origin: "optout" } })
        router.push({
          pathname: "/espace-pro/creation/detail",
          query: { informationSiret: JSON.stringify(data), type: AUTHTYPE.CFA, origin: "optout" },
        })
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
        router.push("/espace-pro/")
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
