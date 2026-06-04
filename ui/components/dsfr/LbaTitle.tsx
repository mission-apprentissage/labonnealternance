import { Typography, type TypographyProps } from "@mui/material"
import type React from "react"

type LbaTitleProps = {
  component: NonNullable<TypographyProps["component"]>
  sx?: TypographyProps["sx"]
  children: React.ReactNode
}

const defaultSxByComponent: Partial<Record<string, TypographyProps["sx"]>> = {
  h1: {
    fontSize: { xs: "22px !important", md: "32px !important" },
    lineHeight: { xs: "28px !important", md: "40px !important" },
    fontWeight: 700,
  },
  h2: {
    fontSize: { xs: "18px !important", md: "20px !important" },
    lineHeight: { xs: "24px !important", md: "28px !important" },
    fontWeight: 700,
  },
}

export const LbaTitle = ({ component, sx, children }: LbaTitleProps) => {
  const componentStr = typeof component === "string" ? component : undefined
  const defaultSx = componentStr ? defaultSxByComponent[componentStr] : undefined
  return (
    <Typography component={component as React.ElementType} sx={[defaultSx ?? {}, ...(Array.isArray(sx) ? sx : [sx ?? {}])]}>
      {children}
    </Typography>
  )
}
