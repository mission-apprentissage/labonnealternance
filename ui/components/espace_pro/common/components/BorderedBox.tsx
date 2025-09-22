import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

export const BorderedBox = ({ children, sx }: Parameters<typeof Box>[0]) => (
  <Box sx={{ border: "1px solid #000091", p: { xs: fr.spacing("1w"), lg: fr.spacing("2w") }, ...sx }}>{children}</Box>
)
