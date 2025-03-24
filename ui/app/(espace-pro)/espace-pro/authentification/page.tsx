"use client"
import { Heading, Stack, Text, useToast } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { Alert } from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material"
import { Form, Formik } from "formik"
import z from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import { CustomInput } from "@/components/espace_pro"
import { sendMagiclink } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function Authentification() {
  const { error } = useSearchParamsRecord()
  const hasError = Boolean(error === "true")

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
    <Dialog
      open={true}
      fullScreen={true}
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          },
        },
      }}
    >
      {hasError && <Alert severity="error" title="Veuillez vous reconnecter" description="Session invalidée" />}
      <Box>
        <DialogTitle sx={{ padding: fr.spacing("5w") }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button linkProps={{ href: PAGES.static.home.getPath() }} priority="tertiary" iconId="fr-icon-close-line" iconPosition="right">
              Fermer
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            maxWidth: "md",
            padding: fr.spacing("5w"),
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <Stack direction="column" spacing={7} bg="grey.150" p={["4", "8"]}>
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
                      <Button type="submit" disabled={!isValid || isSubmitting} iconId="fr-icon-arrow-right-line" iconPosition="right">
                        Me connecter
                      </Button>
                    </Form>
                  )
                }}
              </Formik>
            </Box>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  )
}
