import { Box, Heading, Link, Text, useBoolean } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import { apiPost } from "@/utils/api.utils"

import { AuthentificationLayout, LoadingEmptySpace } from "../../../../../components/espace_pro"

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
  const { token } = router.query as { token: string }

  // const { setUser } = useAuth()
  const setUser = (_u: any) => {
    throw new Error("Function not implemented.")
  }

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
          setTimeout(() => router.push("/"), 10000)
        } else {
          setUser(user)
          router.push("/espace-pro/authentification/validation")
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
  }, [token])

  return (
    <>
      {loading && <LoadingEmptySpace label="Vérification en cours" />}
      {validationState && (
        <AuthentificationLayout>{validationState === "Attente" ? <EmailEnValidationManuelle /> : validationState === "Error" ? <ErreurValidation /> : null}</AuthentificationLayout>
      )}
    </>
  )
}
