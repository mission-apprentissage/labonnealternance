import { Box, Typography } from "@mui/material"

export const CfaCandidatInformationOther = () => {
  return (
    <Box sx={{ mt: 4, p: 4, backgroundColor: "#F5F5FE" }}>
      <Typography variant="h2" sx={{ fontWeight: 700, color: "#000091", fontSize: "22px", lineHeight: "36px" }}>
        Votre réponse au candidat
      </Typography>
      <Typography component="p" sx={{ mt: 4, fontWeight: 700, color: "#1E1E1E", fontSize: "18px", lineHeight: "28px" }}>
        Merci pour votre réponse !
      </Typography>
      <Typography component="p" sx={{ mt: 2, fontWeight: 400, color: "#929292", fontSize: "16px", lineHeight: "24px" }}>
        Vous nous avez indiqué avoir répondu au candidat par un autre canal (mail ou téléphone).
      </Typography>
    </Box>
  )
}
