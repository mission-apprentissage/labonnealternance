import { Box, Heading, Link, Text, useBoolean } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { AUTHTYPE } from "../../../../../common/contants"
import useAuth from "../../../../../common/hooks/useAuth"
import { AuthentificationLayout, LoadingEmptySpace } from "../../../../../components/espace_pro"
import { validationCompte } from "../../../../../utils/api"

const EmailValide = () => (
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

const EmailInvalide = () => (
  <Box pt={["6", "12"]} px={["6", "8"]}>
    <Heading fontSize="28px" as="h1" mb={7}>
      Mail invalide
    </Heading>
    <Text fontSize="18px">
      La validation de votre email à échoué. Merci de{" "}
      <Link pl={2} href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Authentification%20LBAR%20-%20Mail%20invalide" textDecoration="underline">
        Contacter l'équipe La bonne alternance
      </Link>
    </Text>
  </Box>
)

export default function ConfirmationValidationEmail() {
  const [loading, setLoading] = useBoolean()
  const [isInvalid, setIsInvalid] = useBoolean()
  const [isAwaitingValidation, setIsAwaitingValidation] = useBoolean()
  const router = useRouter()
  const { id } = router.query
  const [auth, setAuth] = useAuth()

  useEffect(() => {
    setLoading.on()
    // get user from params coming from email link
    validationCompte({ id })
      .then(({ data }) => {
        if (data?.isUserAwaiting) {
          setLoading.off()
          setIsInvalid.off()
          setIsAwaitingValidation.on()
          // setTimeout(() => redirect("/", true), 10000)
        }
        if (data?.token) {
          setLoading.off()
          setAuth(data?.token)
        }
      })
      .catch(() => {
        setLoading.off()
        setIsInvalid.on()
      })
  }, [id])

  useEffect(() => {
    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        setTimeout(() => {
          router.push({
            pathname: `/espace-pro/administration/entreprise/${auth.establishment_id}`,
            query: { newUser: true },
          })
        }, 1000)
        break

      case AUTHTYPE.CFA:
        setTimeout(() => {
          router.push("/espace-pro/administration")
        }, 1000)
        break

      case AUTHTYPE.OPCO:
        setTimeout(() => {
          router.push("/espace-pro/administration/opco")
        }, 1000)
        break

      default:
        break
    }
  }, [auth])

  return (
    <>
      {loading && <LoadingEmptySpace label="Vérification en cours" />}
      {isAwaitingValidation && (
        <AuthentificationLayout>
          <EmailValide />
        </AuthentificationLayout>
      )}
      {isInvalid && (
        <AuthentificationLayout>
          <EmailInvalide />
        </AuthentificationLayout>
      )}
    </>
  )
}
