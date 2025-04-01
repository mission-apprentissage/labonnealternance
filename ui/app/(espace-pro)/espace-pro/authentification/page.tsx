"use client"
import { Divider, Heading, Stack, Text } from "@chakra-ui/react"
import { Alert } from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { useState } from "react"
import z from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import { CustomInput } from "@/components/espace_pro"
import { sendMagiclink } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function Authentification() {
  const { error } = useSearchParamsRecord()
  const hasError = Boolean(error === "true")
  const router = useRouter()

  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState(hasError ? "Session invalidée" : "")

  const submitEmail = (values, { setFieldError, setSubmitting }) => {
    setMagicLinkSent(true)
    setErrorMessage("")

    sendMagiclink(values)
      .then(() => {
        setTimeout(() => {
          setSubmitting(false)
        }, 4000)
      })
      .catch(({ context }) => {
        switch (context?.errorData) {
          case "DISABLED":
            setFieldError(
              "email",
              `Le compte utilisateur est désactivé, merci de prendre contact avec le <a style="text-decoration:underline;" href="mailto:labonnealternance-contact@apprentissage.beta.gouv.fr?subject=Compte CFA La bonne alternance désactivé">support</a>`
            )
            setErrorMessage("Le compte utilisateur est désactivé")
            break
          case "UNKNOWN":
            setFieldError("email", "Adresse email invalide.")
            setErrorMessage("Adresse email invalide")
            break
          case "VALIDATION":
            setFieldError("email", "Le compte utilisateur est en attente de validation")
            setErrorMessage("Le compte utilisateur est en attente de validation")
            break
          case "VERIFY":
            setFieldError("email", "Votre adresse n’a pas été vérifiée. Cliquez sur le lien que nous venons de vous transmettre pour vérifier votre compte")
            setErrorMessage("Votre adresse n’a pas été vérifiée")
            break
          default:
            setFieldError("email", "une erreur est survenue")
            setErrorMessage("Une erreur est survenue")
            break
        }

        setSubmitting(false)
      })
  }

  const Alerts = () => (
    <>
      {errorMessage && (
        <Box mb={2}>
          <Alert
            severity="error"
            title={errorMessage !== "Session invalidée" ? "Erreur de connexion" : "Veuillez vous reconnecter"}
            description={errorMessage || "Session invalidée"}
          />
        </Box>
      )}
      {magicLinkSent && !errorMessage && (
        <Box mb={2}>
          <Alert severity="success" title="Un lien de connexion a été envoyé" description="Vérifiez votre boite mail et cliquez sur le lien pour vous connecter" />
        </Box>
      )}
    </>
  )

  return (
    <Box
      sx={{
        maxWidth: "md",
        justifyContent: "center",
        alignContent: "center",
        margin: "auto",
      }}
    >
      <Stack direction="column" bg="grey.150" p={["4", "8"]}>
        <Heading fontSize="32px" as="h2">
          Vous avez déjà un compte ?
        </Heading>
        <Text fontSize="xl">Indiquez le mail avec lequel vous avez créé votre compte et vous recevrez un lien pour vous connecter.</Text>
        <Box>
          <Formik
            validateOnMount
            initialValues={{ email: undefined }}
            validationSchema={toFormikValidationSchema(
              z.object({
                email: z.string({ required_error: "Champ obligatoire" }).email("Insérez un email valide"),
              })
            )}
            onSubmit={submitEmail}
          >
            {({ values, isValid, isSubmitting }) => {
              return (
                <Form autoComplete="off">
                  <CustomInput required={false} name="email" label="Votre email" type="text" value={values.email} />
                  <Alerts />
                  <Button type="submit" disabled={!isValid || isSubmitting} iconId="fr-icon-arrow-right-line" iconPosition="right">
                    Me connecter
                  </Button>
                </Form>
              )
            }}
          </Formik>
        </Box>

        <Divider mt={4} pb={0} />

        <Text fontSize={24} mb={1}>
          Vous n'avez pas de compte ?
        </Text>
        <Button priority="secondary" type="button" onClick={() => router.push(PAGES.static.espaceProCreationEntreprise.getPath())}>
          Créer un compte
        </Button>
      </Stack>
    </Box>
  )
}
