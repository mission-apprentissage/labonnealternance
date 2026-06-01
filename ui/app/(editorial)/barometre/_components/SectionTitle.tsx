import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export function SectionTitle({
  title,
  highlightedText,
  component = "h2",
  fontSize = "32px",
  lineHeight = "40px",
  mt,
}: {
  title: string
  highlightedText?: string
  component?: "h1" | "h2" | "h3"
  fontSize?: string
  lineHeight?: string
  mt?: string
}) {
  return (
    <Box sx={{ mb: fr.spacing("6v"), mt }}>
      <Typography
        component={component}
        sx={{
          fontWeight: 700,
          fontSize,
          lineHeight,
          color: fr.colors.decisions.text.title.grey.default,
          mb: fr.spacing("4v"),
        }}
      >
        {title}
        {highlightedText && <span style={{ color: fr.colors.decisions.artwork.minor.purpleGlycine.default }}> {highlightedText}</span>}
      </Typography>
      <Box
        component="hr"
        sx={{ maxWidth: "93px", border: "none", borderTop: `4px solid ${fr.colors.decisions.artwork.minor.purpleGlycine.default}`, opacity: 1, m: 0 }}
        aria-hidden="true"
      />
    </Box>
  )
}
