import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export function RechercheFormTitle() {
  return (
    <Typography component="h1" sx={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 }}>
      Trouver emploi et formation{" "}
      <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
        en alternance
      </Box>
    </Typography>
  )
}
