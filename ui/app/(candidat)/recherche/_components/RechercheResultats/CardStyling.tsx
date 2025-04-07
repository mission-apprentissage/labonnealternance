import { Box } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import React from "react"

export const CardStyling = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      "& .fr-card.fr-enlarge-link:not(.fr-card--no-icon) .fr-card__content, .fr-card.fr-enlarge-button:not(.fr-card--no-icon) .fr-card__content": {
        px: fr.spacing("2w"),
        py: fr.spacing("2w"),
      },
    }}
  >
    {children}
  </Box>
)
