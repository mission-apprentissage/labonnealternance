import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography, TextField } from "@mui/material"

export const CfaCandidatInformationForm = (props) => {
  const formik = props.formik

  return (
    <form onSubmit={formik.handleSubmit}>
      <Box sx={{ mt: 4, p: 4, backgroundColor: "#F5F5FE" }}>
        <Typography variant="h2" sx={{ fontWeight: 700, color: "#000091", fontSize: "22px", lineHeight: "36px" }}>
          Votre réponse au candidat
        </Typography>
        <Typography sx={{ fontWeight: 400, color: "#161616", fontSize: "16px", lineHeight: "24px", mt: 4 }}>Quelle est votre réponse ?</Typography>
        <Typography sx={{ fontWeight: 400, color: "#666666", fontSize: "12px", lineHeight: "20px", mt: 1 }}>
          Le candidat recevra votre réponse directement dans sa boîte mail.
        </Typography>
        <TextField
          id="message"
          name="message"
          multiline
          rows={8}
          fullWidth
          error={formik.touched.message && Boolean(formik.errors.message)}
          helperText={formik.touched.message && formik.errors.message}
          onChange={formik.handleChange}
          value={formik.values.message}
          placeholder={`Bonjour,
    Merci pour l'intérêt que vous portez à notre formation. Voici les réponses aux points qui vous intéressent :
    Pour toute demande complémentaire ou pour vous inscrire, vous pouvez contacter mon collègue à l'adresse suivante`}
          sx={{
            my: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "4px 4px 0px 0px",
            },
          }}
        />
        <Box>
          <Button aria-label="Envoyer la réponse" type="submit">
            Envoyer ma réponse
          </Button>
        </Box>
        <Box sx={{ mt: 6 }}>
          <Button priority="secondary" onClick={props.otherClicked}>
            J'ai répondu au candidat par un autre canal (mail ou téléphone)
          </Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button priority="secondary" onClick={props.unreachableClicked}>
            Le candidat n'est pas joignable
          </Button>
        </Box>
      </Box>
    </form>
  )
}
