import type { TypographyVariant } from "@mui/material"
import { Typography } from "@mui/material"

export const Paragraph = ({ children, bold, component, variant }: { children: React.ReactNode; bold?: boolean; component?: React.ElementType; variant?: TypographyVariant }) => (
  <Typography component={component || "p"} variant={variant || "body1"} fontWeight={bold ? "bold" : "normal"}>
    {children}
  </Typography>
)
