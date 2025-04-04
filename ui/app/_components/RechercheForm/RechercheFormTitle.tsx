import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export function RechercheFormTitle() {
  return (
    <Typography sx={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 }}>
      Se former et travailler{" "}
      <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
        en alternance
      </Box>
    </Typography>
  )
}
