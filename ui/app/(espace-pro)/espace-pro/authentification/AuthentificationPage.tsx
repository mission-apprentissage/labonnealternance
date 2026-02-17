"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Alert } from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Divider, Typography } from "@mui/material"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { useState } from "react"
import z from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CustomInput from "@/app/_components/CustomInput"
import { apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function Authentification() {
  const { error } = useSearchParamsRecord()
  const hasError = Boolean(error === "true")
  const router = useRouter()

  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(hasError ? "Session invalidée" : "")

  const submitEmail = (values: { email: string }, { setFieldError, setSubmitting }) => {
    setMagicLinkSent(true)
    setErrorMessage("")
    setLoading(true)

    apiPost(`/login/magiclink`, { body: values })
      .then(() => {
        setTimeout(() => {
          setSubmitting(false)
        }, 4000)
        setLoading(false)
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

        setLoading(false)
        setSubmitting(false)
      })
  }

  const Alerts = () => (
    <>
      {errorMessage && (
        <Box
          sx={{
            mb: 2,
          }}
        >
          <Alert
            severity="error"
            title={errorMessage !== "Session invalidée" ? "Erreur de connexion" : "Veuillez vous reconnecter"}
            description={errorMessage || "Session invalidée"}
          />
        </Box>
      )}
      {magicLinkSent && !loading && !errorMessage && (
        <Box
          sx={{
            mb: 2,
          }}
        >
          <Alert severity="success" title="Un lien de connexion a été envoyé" description="Vérifiez votre boite mail et cliquez sur le lien pour vous connecter" />
        </Box>
      )}
    </>
  )

  return (
    <Box
      sx={{
        maxWidth: "md",
        margin: "auto",
      }}
    >
      <Box
        sx={{
          maxWidth: "sm",
          justifyContent: "center",
          alignContent: "center",
          bg: "grey.150",
          padding: "16px",
          margin: "auto",
        }}
      >
        <Typography variant="h5" sx={{ mb: fr.spacing("6v") }}>
          Vous avez déjà un compte ?
        </Typography>
        <Typography sx={{ mb: fr.spacing("3v") }}>Indiquez le mail avec lequel vous avez créé votre compte et vous recevrez un lien pour vous connecter.</Typography>
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
                  <CustomInput required={false} name="email" label="Votre email" type="email" value={values.email} autoFocus />
                  <Alerts />
                  <Button type="submit" disabled={!isValid || isSubmitting} style={{ width: "100%" }}>
                    <Box
                      sx={{
                        margin: "auto",
                      }}
                    >
                      Se connecter
                    </Box>
                  </Button>
                </Form>
              )
            }}
          </Formik>
        </Box>

        <Divider />

        <Typography variant="h5" sx={{ mt: fr.spacing("4v"), mb: fr.spacing("6v") }}>
          Vous n'avez pas de compte ?
        </Typography>
        <Button priority="secondary" type="button" onClick={() => router.push(PAGES.static.espaceProCreationEntreprise.getPath())} style={{ width: "100%" }}>
          <Box
            sx={{
              margin: "auto",
            }}
          >
            Je suis une entreprise
          </Box>
        </Button>
        <Box sx={{ mt: fr.spacing("2w") }}>
          <Button priority="secondary" type="button" onClick={() => router.push(PAGES.static.espaceProCreationCfa.getPath())} style={{ width: "100%" }}>
            <Box
              sx={{
                margin: "auto",
              }}
            >
              Je suis un organisme de formation
            </Box>
          </Button>
        </Box>
        <Typography sx={{ mt: fr.spacing("2w") }}>
          <strong>Vous êtes candidat ?</strong> La création de compte est réservée aux entreprises et aux centres de formation. Démarrez vos recherches et postulez à toutes les
          offres d’emploi et de formation sans vous créer de compte.
        </Typography>
        <Box sx={{ mt: fr.spacing("2w") }}>
          <Button priority="secondary" type="button" onClick={() => router.push(PAGES.static.home.getPath())} style={{ width: "100%" }}>
            <Box
              sx={{
                margin: "auto",
              }}
            >
              Je suis un candidat
            </Box>
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
