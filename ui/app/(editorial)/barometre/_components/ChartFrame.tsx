import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"

export function ChartFrame({ title, caption, source = "La bonne alternance", children }: { title: ReactNode; caption?: string; source?: string; children: ReactNode }) {
  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        my: fr.spacing("10v"),
        pt: fr.spacing("3v"),
        borderTop: `2px solid ${fr.colors.decisions.text.title.grey.default}`,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <Box component="figcaption" sx={{ mb: fr.spacing("5v") }}>
        <Typography sx={{ fontWeight: 700, fontSize: { xs: "16px", md: "18px" }, color: fr.colors.decisions.text.title.grey.default, lineHeight: 1.3 }}>{title}</Typography>
        {caption ? (
          <Typography component="p" sx={{ fontSize: "13px", color: fr.colors.decisions.text.mention.grey.default, mt: fr.spacing("1v"), mb: 0 }}>
            {caption}
          </Typography>
        ) : null}
      </Box>

      {children}

      <Typography component="p" sx={{ mt: "auto", pt: fr.spacing("4v"), mb: 0, fontSize: "12px", color: fr.colors.decisions.text.mention.grey.default }}>
        Source&nbsp;: {source}
      </Typography>
    </Box>
  )
}
