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

    // TODO_AB
    // router.push({
    //   pathname: '/B',
    //   query: { result: JSON.stringify(result) }
    // });

    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        // setTimeout(() => {
        //   // TODO_AB
        //   router.push(`/espace-pro/administration/entreprise/${auth.establishment_id}`, {
        //     state: { offerPopup: Object.keys(fromEntrepriseCreation).length > 0 ? true : false },
        //   })
        // }, 1000)
        // TODO_AB
        router.push(`/espace-pro/administration/entreprise/${auth.establishment_id}`, {
          state: { offerPopup: Object.keys(fromEntrepriseCreation).length > 0 ? true : false },
        })
        break

      case AUTHTYPE.OPCO:
        // setTimeout(() => {
        //   // TODO_AB
        //   router.push(`/espace-pro/administration/opco`, { replace: true })
        // }, 1000)
        // TODO_AB
        router.push(`/espace-pro/administration/opco`, { replace: true })
        break

      case AUTHTYPE.CFA:
        // setTimeout(() => {
        //   window.location.href = "espace-pro/administration"
        // }, 1000)
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
