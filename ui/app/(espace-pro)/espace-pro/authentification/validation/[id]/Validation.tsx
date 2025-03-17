"use client"
import { Box, Heading, Link, Text, useBoolean } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
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
  const [loading, setLoading] = useBoolean()
  const [validationState, setValidationState] = useState<"Attente" | "Error" | null>(null)
  const router = useRouter()
  const token = useSearchParams().get("token")

  useEffect(() => {
    const fetchData = async () => {
      setLoading.on()
      if (token) {
        const user = await apiPost("/etablissement/validation", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        if (user.status_current === ETAT_UTILISATEUR.ATTENTE) {
          setValidationState("Attente")
          setTimeout(() => router.push(PAGES.static.accesRecruteur.getPath()), 10000)
        } else {
          router.push(PAGES.static.authentification.getPath())
        }
      }
    }
    fetchData()
      .catch(() => {
        setValidationState("Error")
      })
      .finally(() => {
        setLoading.off()
      })
  }, [token, router, setLoading])

  return (
    <>
      {loading && <LoadingEmptySpace label="Vérification en cours" />}
      {validationState && (validationState === "Attente" ? <EmailEnValidationManuelle /> : validationState === "Error" ? <ErreurValidation /> : null)}
    </>
  )
}
