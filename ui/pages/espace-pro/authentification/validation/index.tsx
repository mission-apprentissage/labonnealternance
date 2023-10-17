import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { authProvider, withAuth } from "@/components/espace_pro/withAuth"
import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../../../common/contants"

function RedirectAfterAuth() {
  const router = useRouter()
  const { user } = useAuth()

  const fromEntrepriseCreation = router.query

  useEffect(() => {
    switch (user.type) {
      case AUTHTYPE.ENTREPRISE:
        router.push({
          pathname: `/espace-pro/administration/entreprise/${user.establishment_id}`,
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
  }, [user])

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

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(RedirectAfterAuth))
