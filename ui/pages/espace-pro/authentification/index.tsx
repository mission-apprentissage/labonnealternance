import { Box, Button, Center, Flex, Heading, Stack, Text, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import * as Yup from "yup"

import { AnimationContainer, AuthentificationLayout, CustomInput } from "../../../components/espace_pro"
import { ArrowRightLine } from "../../../theme/components/icons"
import { sendMagiclink } from "../../../utils/api"

const ConnexionCompte = () => {
  const toast = useToast()

  const submitEmail = (values, { setFieldError, setSubmitting }) => {
    sendMagiclink(values)
      .then(() => {
        toast({
          title: "Vérification de l'email.",
          description: "Un lien d'accès personnalisé a été envoyé à votre adresse.",
          position: "top-right",
          status: "success",
          duration: 5000,
        })
        setTimeout(() => {
          setSubmitting(false)
        }, 15000)
      })
      .catch(({ response }) => {
        switch (response.data.reason) {
          case "DISABLED":
            setFieldError(
              "email",
              `Le compte utilisateur est désactivé, merci de prendre contact avec le <a style="text-decoration:underline;" href="mailto:labonnealternance-contact@apprentissage.beta.gouv.fr?subject=Compte CFA La bonne alternance désactivé">support</a>`
            )
            break
          case "UNKNOWN":
            setFieldError("email", "Adresse email invalide.")
            break
          case "VALIDATION":
            setFieldError("email", "Le compte utilisateur est en attente de validation")
            break
          case "VERIFY":
            setFieldError("email", "Votre adresse n’a pas été vérifiée. Cliquez sur le lien que nous venons de vous transmettre pour vérifier votre compte")
            break
          default:
            setFieldError("email", "une erreur est survenue")
        }

        setSubmitting(false)
      })
  }

  return (
    <Stack direction="column" spacing={7} bg="grey.150" p={["4", "8"]}>
      <Heading fontSize="32px" as="h2">
        Vous avez déjà un compte ?
      </Heading>
      <Text fontSize="xl">Indiquez le mail avec lequel vous avez créé votre compte et vous recevrez un lien pour vous connecter.</Text>
      <Box>
        <Formik
          validateOnMount
          initialValues={{ email: undefined }}
          validationSchema={Yup.object().shape({
            email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
          })}
          onSubmit={submitEmail}
        >
          {({ values, isValid, isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <CustomInput required={false} name="email" label="Votre email" type="text" value={values.email} />

                <Button mt={5} type="submit" variant="form" leftIcon={<ArrowRightLine width={5} />} isActive={isValid} isDisabled={!isValid || isSubmitting}>
                  Me connecter
                </Button>
              </Form>
            )
          }}
        </Formik>
      </Box>
    </Stack>
  )
}

export default function Connexion() {
  return (
    <AnimationContainer>
      <AuthentificationLayout>
        <Flex align="center" justify="center" flex="1">
          <Center h="100vh">
            <Box bg="grey.150" maxW={["auto", "50%"]}>
              <ConnexionCompte />
            </Box>
          </Center>
        </Flex>
      </AuthentificationLayout>
    </AnimationContainer>
  )
}
