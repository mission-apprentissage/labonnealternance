import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, FormControl, FormHelperText, TextareaAutosize, Typography } from "@mui/material"

export const CfaCandidatInformationForm = (props) => {
  const formik = props.formik

  return (
    <form onSubmit={formik.handleSubmit}>
      <Box sx={{ mt: fr.spacing("2v"), p: fr.spacing("8v"), backgroundColor: "#F5F5FE" }}>
        <Typography variant="h2" sx={{ fontWeight: 700, color: "#000091", fontSize: "2rem" }}>
          Votre réponse au candidat
        </Typography>
        <Typography sx={{ fontWeight: 400, color: "#161616", mt: fr.spacing("3v") }}>Quelle est votre réponse ?</Typography>
        <Typography sx={{ fontWeight: 400, color: "#666666", mb: fr.spacing("3v") }}>Le candidat recevra votre réponse directement dans sa boîte mail.</Typography>
        <FormControl error={formik.touched.message && Boolean(formik.errors.message)} fullWidth sx={{ pb: fr.spacing("4v") }}>
          <TextareaAutosize
            className={fr.cx("fr-input")}
            id="message"
            name="message"
            // minRows={4}
            onChange={formik.handleChange}
            value={formik.values.message}
            placeholder={`Bonjour,
            Merci pour l'intérêt que vous portez à notre formation. Voici les réponses aux points qui vous intéressent :
            Pour toute demande complémentaire ou pour vous inscrire, vous pouvez contacter mon collègue à l'adresse suivante`}
          />
          <FormHelperText>{formik.touched.message && formik.errors.message}</FormHelperText>
        </FormControl>
        <Box>
          <Button aria-label="Envoyer la réponse" type="submit">
            Envoyer ma réponse
          </Button>
        </Box>
        <Box sx={{ mt: fr.spacing("4v") }}>
          <Button priority="secondary" onClick={props.otherClicked}>
            J'ai répondu au candidat par un autre canal (mail ou téléphone)
          </Button>
        </Box>
        <Box sx={{ mt: fr.spacing("4v") }}>
          <Button priority="secondary" onClick={props.unreachableClicked}>
            Le candidat n'est pas joignable
          </Button>
        </Box>
      </Box>
    </form>
  )
}
