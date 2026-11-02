import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { ReactNode } from "react"

export function Insight({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        my: fr.spacing("8v"),
        pl: fr.spacing("5v"),
        maxWidth: "72ch",
        borderLeft: `4px solid ${fr.colors.decisions.background.actionHigh.blueFrance.default}`,
        color: fr.colors.decisions.text.title.grey.default,
        "& p": { fontSize: "18px", lineHeight: "28px" },
      }}
    >
      {children}
    </Box>
  )
}
