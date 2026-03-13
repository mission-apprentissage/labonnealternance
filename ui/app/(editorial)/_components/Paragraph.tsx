import type { TypographyProps, TypographyVariant } from "@mui/material"
import { Typography } from "@mui/material"
import type { ElementType, ReactNode } from "react"

interface ParagraphProps extends TypographyProps {
  children: ReactNode
  bold?: boolean
  component?: ElementType
  variant?: TypographyVariant
}

export const Paragraph = ({ children, bold, component, variant, ...props }: ParagraphProps) => (
  <Typography component={component || "p"} variant={variant || "body1"} fontWeight={bold ? "bold" : "normal"} {...props}>
    {children}
  </Typography>
)
