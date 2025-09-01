import { Box } from "@mui/material"

export const BorderedBox = ({ children, sx }: Parameters<typeof Box>[0]) => (
  <Box sx={{ border: "1px solid #000091", px: { xs: 1, lg: 2 }, py: { xs: 1, lg: 2 }, ...sx }}>{children}</Box>
)
