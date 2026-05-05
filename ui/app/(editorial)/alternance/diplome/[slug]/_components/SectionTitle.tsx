import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export function SectionTitle({
  title,
  highlightedText,
  highlightedSuffix,
  description,
}: {
  title: string
  highlightedText?: string
  highlightedSuffix?: string
  description?: string
}) {
  return (
    <Box sx={{ mb: fr.spacing("6v") }}>
      <Typography
        component="h2"
        sx={{
          fontWeight: 700,
          fontSize: "32px",
          lineHeight: "40px",
          color: fr.colors.decisions.text.title.grey.default,
          mb: fr.spacing("2v"),
        }}
      >
        {title}
        {highlightedText && <span style={{ color: fr.colors.decisions.text.default.info.default }}> {highlightedText}</span>}
        {highlightedSuffix && ` ${highlightedSuffix}`}
      </Typography>
      <Box component="hr" sx={{ maxWidth: "89px", border: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1, mb: fr.spacing("6v") }} />
      {description && <Typography sx={{ fontSize: "18px", lineHeight: "28px" }}>{description}</Typography>}
    </Box>
  )
}
