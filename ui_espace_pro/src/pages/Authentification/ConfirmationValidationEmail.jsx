import { Box, Flex, Heading, Link, Spinner, Text, useBoolean } from "@chakra-ui/react"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { validationCompte } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { AuthentificationLayout } from "../../components"

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

export function ConfirmationValidationEmail(props) {
  const [isValid, setIsValid] = useBoolean(true)
  const [isAwaitingValidation, setIsAwaitingValidation] = useBoolean(false)
  const { id } = useParams()
  const navigate = useNavigate()
  const [auth, setAuth, isAuthenticated] = useAuth()

  function navigateToLoggedPage() {
    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        navigate(`/administration/entreprise/${auth.establishment_id}`, { state: { newUser: true } })
        break
      case AUTHTYPE.CFA:
        navigate("/administration")
        break
      case AUTHTYPE.OPCO:
        navigate("/administration/opco")
        break
      default:
        console.warn(`unsupported auth type: ${auth.type}`)
        break
    }
  }

  useEffect(() => {
    if (isAuthenticated()) {
      navigateToLoggedPage()
    }
  }, [auth])

  useEffect(() => {
    // get user from params coming from email link
    validationCompte({ id })
      .then(({ data }) => {
        const { token, isUserAwaiting } = data ?? {}
        console.log(data)
        if (isUserAwaiting) {
          setIsAwaitingValidation.on()
          setTimeout(() => window.location.replace("/"), 10000)
        }
        if (token) {
          setAuth(token)
        }
      })
      .catch(() => setIsValid.off())
  }, [id])

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

export default ConfirmationValidationEmail
