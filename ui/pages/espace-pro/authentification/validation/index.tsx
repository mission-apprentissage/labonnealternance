import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { AUTHTYPE } from "../../../../common/contants"
import useAuth from "../../../../common/hooks/useAuth"

export default function RedirectAfterAuth() {
  const router = useRouter()
  const [auth] = useAuth()

  // TODO_AB
  const fromEntrepriseCreation = router.query

  useEffect(() => {
    if (auth.sub === "anonymous") return

    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        router.push({
          pathname: `/espace-pro/administration/entreprise/${auth.establishment_id}`,
          query: { offerPopup: Object.keys(fromEntrepriseCreation).length > 0 ? true : false },
        })

        break

      case AUTHTYPE.OPCO:
        router.push(`/espace-pro/administration/opco`)
        break

      case AUTHTYPE.CFA:
        router.push("/espace-pro/administration")
        break

      case AUTHTYPE.ADMIN:
        router.push("/espace-pro/administration/users")
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
