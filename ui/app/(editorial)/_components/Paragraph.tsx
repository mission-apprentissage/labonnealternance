import type { TypographyVariant } from "@mui/material"
import { Typography } from "@mui/material"
import type { ElementType, ReactNode } from "react"

export const Paragraph = ({ children, bold, component, variant }: { children: ReactNode; bold?: boolean; component?: ElementType; variant?: TypographyVariant }) => (
  <Typography component={component || "p"} variant={variant || "body1"} fontWeight={bold ? "bold" : "normal"}>
    {children}
  </Typography>
)
