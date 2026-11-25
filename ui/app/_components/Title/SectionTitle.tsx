import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography, type TypographyProps } from "@mui/material"
import type React from "react"

type SectionTitleProps = {
  id?: string
  variant?: TypographyProps["variant"]
  highlight?: React.ReactNode
  children: React.ReactNode
}

export const SectionTitle = ({ id, variant = "h1", highlight, children }: SectionTitleProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
    <Typography id={id} component="h2" variant={variant}>
      {children}
      {highlight && (
        <Box component="span" sx={{ display: "block", color: fr.colors.decisions.border.default.blueFrance.default }}>
          {highlight}
        </Box>
      )}
    </Typography>
    <Box aria-hidden="true" sx={{ width: "13%", minWidth: "80px", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
  </Box>
)
