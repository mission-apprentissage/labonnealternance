"use client"
import { Box, Heading, Link, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const EmailEnValidationManuelle = () => (
  <Box pt={["6", "12"]} px={["6", "8"]}>
    <Heading fontSize="28px" as="h1" mb={7}>
      Merci ! Votre adresse email est bien confirmée.
    </Heading>
    <Text fontSize="18px">Nos équipes se chargent à présent de valider votre compte. Vous serez notifié par email dès que ce sera fait.</Text>
    <Text fontSize="18px">À bientôt sur La bonne alternance !</Text>
    <Text fontSize="18px" pt={3}>
      Vous allez être redirigé automatiquement dans quelques instants...
    </Text>
  </Box>
)

const ErreurValidation = () => (
  <Box pt={["6", "12"]} px={["6", "8"]}>
    <Heading fontSize="28px" as="h1" mb={7}>
      Mail invalide
    </Heading>
    <Text fontSize="18px">
      La validation de votre email a échoué. Merci de{" "}
      <Link pl={2} href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Authentification%20LBAR%20-%20Mail%20invalide" textDecoration="underline">
        Contacter l'équipe La bonne alternance
      </Link>
    </Text>
  </Box>
)

export default function ConfirmationValidationEmail() {
  const router = useRouter()
  const token = useSearchParams().get("token")

  const validateUser = (token) =>
    apiPost("/etablissement/validation", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

  const response = useQuery({
    queryKey: ["postValidation", token],
    queryFn: () => validateUser(token),
    enabled: Boolean(token),
  })

  useEffect(() => {
    if (!response.isFetched || !response.data) return

    if (response.data.status_current === ETAT_UTILISATEUR.ATTENTE) {
      setTimeout(() => router.push(PAGES.static.accesRecruteur.getPath()), 10000)
    } else {
      router.push(PAGES.static.authentification.getPath())
    }
  }, [response.isFetched, router, response.data])

  if (response.isLoading) {
    return <LoadingEmptySpace label="Vérification en cours" />
  }

  if (response.isError) {
    return <ErreurValidation />
  }

  return <EmailEnValidationManuelle />
}
