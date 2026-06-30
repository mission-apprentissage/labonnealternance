import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

type PreviewSegment = { type?: "hit" | "text"; value?: string }

interface SearchHitPreviewProps {
  preview: PreviewSegment[]
}

export function SearchHitPreview({ preview }: SearchHitPreviewProps) {
  return (
    <>
      {preview.map((segment, index) =>
        segment.type === "hit" && segment.value ? (
          <Box key={index} component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
            {segment.value}
          </Box>
        ) : segment.value ? (
          <span key={index}>{segment.value}</span>
        ) : null
      )}
    </>
  )
}
