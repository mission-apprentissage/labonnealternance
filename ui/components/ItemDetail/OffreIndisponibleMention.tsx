import { fr } from "@codegouvfr/react-dsfr"
import type { SxProps, Theme } from "@mui/material"
import { Box, Typography } from "@mui/material"
import type { IOffreIndisponibilite } from "./offre-indisponible.utils"

const VARIANTS: Record<IOffreIndisponibilite, { message: string; color: string; backgroundColor: string }> = {
  plus_disponible: {
    message: "L’offre n’est plus disponible. Le recruteur n’accepte plus de candidatures.",
    color: fr.colors.decisions.text.default.warning.default,
    backgroundColor: fr.colors.decisions.background.contrast.warning.default,
  },
  en_attente: {
    message: "L’offre est en attente de validation par un administrateur.",
    color: fr.colors.options.blueCumulus.sun368moon732.default,
    backgroundColor: fr.colors.options.blueCumulus._950_100.default,
  },
}

export function OffreIndisponibleMention({ indisponibilite, sx }: { indisponibilite: IOffreIndisponibilite; sx?: SxProps<Theme> }) {
  const { message, color, backgroundColor } = VARIANTS[indisponibilite]
  return (
    <Box
      sx={[
        {
          display: "flex",
          alignItems: "center",
          width: { xs: "100%", md: "fit-content" },
          gap: fr.spacing("1v"),
          px: "6px",
          borderRadius: "4px",
          backgroundColor,
          color,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box component="span" className="fr-icon-lock-fill fr-icon--sm" aria-hidden="true" sx={{ flexShrink: 0 }} />
      <Typography component="p" sx={{ m: 0, fontSize: "12px", lineHeight: "20px", fontStyle: "italic", color: "inherit" }}>
        {message}
      </Typography>
    </Box>
  )
}
