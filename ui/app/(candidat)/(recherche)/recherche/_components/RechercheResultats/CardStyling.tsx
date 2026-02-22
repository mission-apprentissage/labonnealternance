import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import React from "react"

export const CardStyling = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      "& .fr-card.fr-enlarge-link:not(.fr-card--no-icon) .fr-card__content, .fr-card.fr-enlarge-button:not(.fr-card--no-icon) .fr-card__content": {
        px: fr.spacing("4v"),
        py: fr.spacing("4v"),
      },
    }}
  >
    {children}
  </Box>
)
