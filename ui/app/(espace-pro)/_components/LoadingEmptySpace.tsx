import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress, Typography } from "@mui/material"

export default function LoadingEmptySpace({ label = "" }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
        <CircularProgress aria-hidden="true" />
        {/* Le texte porte l'information du spinner masqué (RGAA 7.1) : sans label, il reste lisible par les lecteurs d'écran seuls */}
        <Typography className={label ? undefined : fr.cx("fr-sr-only")}>{label || "Chargement en cours"}</Typography>
      </Box>
    </Box>
  )
}
