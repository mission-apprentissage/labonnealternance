import { Typography, type TypographyProps } from "@mui/material"
import type React from "react"

type ModalTitleProps = {
  component?: NonNullable<TypographyProps["component"]>
  sx?: TypographyProps["sx"]
  children: React.ReactNode
}

const defaultSx = {
  fontSize: { xs: "22px !important", md: "24px !important" },
  lineHeight: { xs: "28px !important", md: "32px !important" },
  fontWeight: 700,
} as const

export const ModalTitle = ({ component = "h1", sx, children }: ModalTitleProps) => {
  const componentStr = typeof component === "string" ? component : undefined

  return (
    <Typography component={componentStr as React.ElementType} sx={[defaultSx ?? {}, ...(Array.isArray(sx) ? sx : [sx ?? {}])]}>
      {children}
    </Typography>
  )
}
