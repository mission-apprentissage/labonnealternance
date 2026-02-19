import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography, Divider } from "@mui/material"
import type { ReactNode } from "react"

export const Section = ({ title, children }: { title?: string; children: ReactNode }) => (
  <Box gap={fr.spacing("4v")} display={"flex"} flexDirection={"column"}>
    {title && (
      <Box display={"flex"} flexDirection={"column"} gap={{ md: fr.spacing("6v"), xs: fr.spacing("4v") }}>
        <Typography component="h2" variant="h2" gutterBottom m={0}>
          {title}
        </Typography>
        <Divider
          sx={{
            padding: 0,
            width: fr.spacing("16v"),
            height: 0,
            background: "none",
            borderBottom: `${fr.spacing("1v")} solid ${fr.colors.decisions.border.default.blueFrance.default}`,
          }}
        />
      </Box>
    )}
    {children}
  </Box>
)
