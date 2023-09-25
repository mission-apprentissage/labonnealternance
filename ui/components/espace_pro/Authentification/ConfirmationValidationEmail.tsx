import { Box, Flex, Heading, Link, Spinner, Text, useBoolean } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

import { AUTHTYPE } from "../../../common/contants"
import useAuth from "../../../common/hooks/useAuth"
import { redirect } from "../../../common/utils/router"
import { validationCompte } from "../../../utils/api"
import { AuthentificationLayout } from "../index"

const EmailValide = () => (
  <Box pt={["6w", "12w"]} px={["6", "8"]}>
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
  <Box pt={["6w", "12w"]} px={["6", "8"]}>
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
  const [isValid, setIsValid] = useBoolean(true)
  const [isAwaitingValidation, setIsAwaitingValidation] = useBoolean(false)
  const router = useRouter()
  const { id } = router.query
  const [auth, setAuth] = useAuth()

  useEffect(() => {
    // get user from params coming from email link
    validationCompte({ id })
      .then(({ data }) => {
        if (data?.isUserAwaiting) {
          setIsAwaitingValidation.on()
          setTimeout(() => redirect("/", true), 10000)
        }
        if (data?.token) {
          setAuth(data?.token)
        }
      })
      .catch(() => setIsValid.off())
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
      {isValid && !isAwaitingValidation && (
        <Box>
          <Flex justify="center" align="center" h="100vh" direction="column">
            <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
            <Text>Verification en cours...</Text>
          </Flex>
        </Box>
      )}
      {isAwaitingValidation && (
        <AuthentificationLayout>
          <EmailValide />
        </AuthentificationLayout>
      )}
      {!isValid && (
        <AuthentificationLayout>
          <EmailInvalide />
        </AuthentificationLayout>
      )}
    </>
  )
}
