import { Box, Flex, Heading, Link, Spinner, Text, useBoolean, useToast } from "@chakra-ui/react"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { validationCompte } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { AuthentificationLayout } from "../../components"

/**
 *
 * Validate email & redirect to admin
 */

const EmailInvalide = () => (
  <>
    <Box pt={["6w", "12w"]} px={["6", "8"]}>
      <Heading fontSize={["32px", "40px"]} as="h1">
        Mail invalide
      </Heading>
      <Text fontSize={["16px", "22px"]}>
        La validation de votre email à échoué. Merci de{" "}
        <Link pl={2} href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Authentification%20LBAR%20-%20Mail%20invalide" textDecoration="underline">
          Contacter l'équipe La bonne alternance
        </Link>
      </Text>
    </Box>
  </>
)

export default (props) => {
  const [isValid, setIsValid] = useBoolean(true)
  const { id } = useParams()
  const navigate = useNavigate()
  const [auth, setAuth] = useAuth()
  const toast = useToast()

  useEffect(() => {
    // get user from params coming from email link
    validationCompte({ id })
      .then(({ data }) => {
        if (data?.isUserAwaiting) {
          toast({
            title: "Merci d’avoir confirmé votre email !",
            description: "Nos équipes vont maintenant pouvoir valider votre compte.",
            position: "top-right",
            status: "success",
            duration: 8000,
            isClosable: true,
          })
          window.location.replace("/")
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
          navigate(`/administration/entreprise/${auth.id_form}`, { state: { newUser: true } })
        }, 1000)
        break

      case AUTHTYPE.CFA:
        setTimeout(() => {
          navigate("/administration")
        }, 1000)
        break

      case AUTHTYPE.OPCO:
        setTimeout(() => {
          navigate("/administration/opco")
        }, 1000)
        break

      default:
        break
    }
  }, [auth])

  return (
    <>
      {isValid && (
        <Box>
          <Flex justify="center" align="center" h="100vh" direction="column">
            <Spinner thickness="4px" speed="0.5s" emptyColor="gray.200" color="bluefrance.500" size="xl" />
            <Text>Verification en cours...</Text>
          </Flex>
        </Box>
      )}
      {!isValid && (
        <AuthentificationLayout>
          <EmailInvalide />
        </AuthentificationLayout>
      )}
    </>
  )
}
