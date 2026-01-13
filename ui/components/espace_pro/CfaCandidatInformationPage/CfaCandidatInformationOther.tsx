import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export const CfaCandidatInformationOther = () => {
  return (
    <Box sx={{ mt: fr.spacing("8v"), p: fr.spacing("8v"), backgroundColor: "#F5F5FE" }}>
      <Typography variant="h2" sx={{ fontWeight: 700, color: "#000091", fontSize: "22px", lineHeight: "36px" }}>
        Votre réponse au candidat
      </Typography>
      <Typography component="p" sx={{ mt: fr.spacing("8v"), fontWeight: 700, color: "#1E1E1E", fontSize: "18px", lineHeight: "28px" }}>
        Merci pour votre réponse !
      </Typography>
      <Typography component="p" sx={{ mt: fr.spacing("4v"), fontWeight: 400, color: "#929292", fontSize: "16px", lineHeight: "24px" }}>
        Vous nous avez indiqué avoir répondu au candidat par un autre canal (mail ou téléphone).
      </Typography>
    </Box>
  )
}
