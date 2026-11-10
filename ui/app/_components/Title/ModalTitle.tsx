import { Typography, type TypographyProps } from "@mui/material"
import type React from "react"
import { FocusedTitle } from "@/app/_components/FocusedTitle"

type ModalTitleProps = {
  id?: string
  component?: NonNullable<TypographyProps["component"]>
  sx?: TypographyProps["sx"]
  /** Contenu qui remplace un formulaire (confirmation, échec) : cf. FocusedTitle. */
  focusOnMount?: boolean
  children: React.ReactNode
}

const defaultSx = {
  fontSize: { xs: "22px !important", md: "24px !important" },
  lineHeight: { xs: "28px !important", md: "32px !important" },
  fontWeight: 700,
} as const

export const ModalTitle = ({ id, component = "h1", sx, focusOnMount = false, children }: ModalTitleProps) => {
  const mergedSx = [defaultSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]
  return focusOnMount ? (
    <FocusedTitle id={id} component={component} sx={mergedSx}>
      {children}
    </FocusedTitle>
  ) : (
    <Typography id={id} component={component} sx={mergedSx}>
      {children}
    </Typography>
  )
}
