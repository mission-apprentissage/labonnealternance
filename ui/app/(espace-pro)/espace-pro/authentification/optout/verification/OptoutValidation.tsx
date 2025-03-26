"use client"
import { Box, Flex, Spinner, Text, useToast } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AUTHTYPE } from "shared/constants/recruteur"

import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function OptOutValidation() {
  const toast = useToast()
  const router = useRouter()

  const { token } = useSearchParamsRecord()

  useEffect(() => {
    if (!token) {
      router.push(PAGES.static.backCfaHome.getPath())
    }

    // send token to back office

    apiGet(`/optout/validate`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
      .then(({ data }: any) => {
        router.push(PAGES.dynamic.espaceProCreationDetail({ siret: data.establishment_siret, type: AUTHTYPE.CFA, origin: "optout", isWidget: false }).getPath())
      })
      .catch(({ context }) => {
        switch (context.errorData) {
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
  }, [token, router, toast])

  return (
    <Box>
      <Flex justify="center" align="center" h="100vh" direction="column">
        <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
        <Text>Vérification en cours...</Text>
      </Flex>
    </Box>
  )
}
