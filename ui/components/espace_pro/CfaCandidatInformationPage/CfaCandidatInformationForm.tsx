import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { useRef } from "react"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"

export const CfaCandidatInformationForm = (props) => {
  const formik = props.formik
  const formRef = useRef<HTMLFormElement>(null)
  const hasError = Boolean(formik.touched.message && formik.errors.message)

  return (
    <form ref={formRef} noValidate onSubmit={createSubmitWithFocusOnError(formRef, formik)}>
      <Box sx={{ mt: fr.spacing("2v"), p: { xs: fr.spacing("3v"), md: fr.spacing("8v") }, backgroundColor: "#F5F5FE" }}>
        <Typography variant="h2" sx={{ fontWeight: 700, color: "#000091", fontSize: "2rem", mb: fr.spacing("3v") }}>
          Votre réponse au candidat
        </Typography>
        <Input
          textArea
          label="Quelle est votre réponse ? (obligatoire)"
          hintText="Le candidat recevra votre réponse directement dans sa boîte mail."
          state={hasError ? "error" : "default"}
          stateRelatedMessage={hasError ? formik.errors.message : undefined}
          nativeTextAreaProps={{
            id: "message",
            name: "message",
            // react-dsfr 1.33.0 ne pose pas aria-invalid en state="error"
            "aria-invalid": hasError,
            // Pas de handleBlur : l'erreur apparue au blur décalerait les boutons « autre canal » / « non joignable » pendant le clic, qui serait perdu
            onChange: formik.handleChange,
            value: formik.values.message,
            rows: 6,
            placeholder: "Saisissez votre texte ici",
          }}
        />
        <Box>
          <Button type="submit">Envoyer ma réponse</Button>
        </Box>
        <Box sx={{ mt: fr.spacing("4v") }}>
          <Button type="button" priority="secondary" onClick={props.otherClicked}>
            J'ai répondu au candidat par un autre canal (mail ou téléphone)
          </Button>
        </Box>
        <Box sx={{ mt: fr.spacing("4v") }}>
          <Button type="button" priority="secondary" onClick={props.unreachableClicked}>
            Le candidat n'est pas joignable
          </Button>
        </Box>
      </Box>
    </form>
  )
}
