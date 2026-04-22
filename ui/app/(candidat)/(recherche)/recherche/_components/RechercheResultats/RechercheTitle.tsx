"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useIsWidget } from "@/app/(candidat)/(recherche)/RechercheLayoutClient"
import { RechercheViewType } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export function RechercheTitle({ viewType }: { viewType?: RechercheViewType }) {
  const isWidget = useIsWidget()
  if (isWidget) return null

  const label = viewType === RechercheViewType.EMPLOI ? "Trouver un emploi" : viewType === RechercheViewType.FORMATION ? "Trouver une formation" : "Trouver formation et emploi"

  return (
    <Box
      sx={{
        display: { xs: "none", lg: "block" },
        maxWidth: "xl",
        margin: "auto",
        py: fr.spacing("4v"),
        px: fr.spacing("4v"),
        position: "relative",
        width: "100%",
      }}
    >
      <Typography component="h1" variant="h1">
        {label}{" "}
        <Typography component="span" variant="h1" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
          en alternance
        </Typography>
      </Typography>
    </Box>
  )
}
