import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export function SectionTitle({ title, highlightedText, description }: { title: string; highlightedText?: string; description?: string }) {
  return (
    <Box sx={{ mb: fr.spacing("6v") }}>
      <h2
        style={{
          fontFamily: '"Marianne", sans-serif',
          fontWeight: 700,
          fontSize: "32px",
          lineHeight: "40px",
          color: "#161616",
          margin: `0 0 ${fr.spacing("2v")} 0`,
        }}
      >
        {title}
        {highlightedText && <span style={{ color: "#0063CB" }}> {highlightedText}</span>}
      </h2>
      <Box component="hr" sx={{ maxWidth: "89px", border: "none", borderTop: `4px solid #0063CB`, opacity: 1, mb: fr.spacing("6v") }} />
      {description && <Typography>{description}</Typography>}
    </Box>
  )
}
