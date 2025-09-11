import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography, TextareaAutosize, FormControl, FormHelperText } from "@mui/material"

export const CfaCandidatInformationForm = (props) => {
  const formik = props.formik

  return (
    <form onSubmit={formik.handleSubmit}>
      <Box sx={{ mt: 1, p: 4, backgroundColor: "#F5F5FE" }}>
        <Typography variant="h2" sx={{ fontWeight: 700, color: "#000091", fontSize: "22px", lineHeight: "36px" }}>
          Votre réponse au candidat
        </Typography>
        <Typography sx={{ fontWeight: 400, color: "#161616", fontSize: "16px", lineHeight: "24px", mt: 4 }}>Quelle est votre réponse ?</Typography>
        <Typography sx={{ fontWeight: 400, color: "#666666", fontSize: "12px", lineHeight: "20px", mt: 1 }}>
          Le candidat recevra votre réponse directement dans sa boîte mail.
        </Typography>
        <FormControl error={formik.touched.message && Boolean(formik.errors.message)} fullWidth sx={{ pb: fr.spacing("2w") }}>
          <TextareaAutosize
            className={fr.cx("fr-input")}
            id="message"
            name="message"
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
        <Box sx={{ mt: fr.spacing("2w") }}>
          <Button priority="secondary" onClick={props.otherClicked}>
            J'ai répondu au candidat par un autre canal (mail ou téléphone)
          </Button>
        </Box>
        <Box sx={{ mt: fr.spacing("2w") }}>
          <Button priority="secondary" onClick={props.unreachableClicked}>
            Le candidat n'est pas joignable
          </Button>
        </Box>
      </Box>
    </form>
  )
}
