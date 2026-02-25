import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

export const BorderedBox = ({ children, sx }: Parameters<typeof Box>[0]) => (
  <Box sx={{ border: "1px solid #000091", p: { xs: fr.spacing("2v"), lg: fr.spacing("4v") }, ...sx }}>{children}</Box>
)
