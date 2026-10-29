"use client"

import { Typography, type TypographyProps } from "@mui/material"
import { useEffect, useRef } from "react"

type FocusedTitleProps = TypographyProps & {
  component?: NonNullable<TypographyProps["component"]>
  /** false quand le contenu peut aussi s'afficher au chargement de la page, sans action de l'usager. */
  autoFocus?: boolean
}

// Titre d'un contenu qui remplace un formulaire : le bouton d'envoi qui avait le focus est démonté,
// le focus est donc placé sur ce titre au montage pour que le résultat soit lu (RGAA 7.5, 12.8).
export function FocusedTitle({ component = "h2", autoFocus = true, sx, ...props }: FocusedTitleProps) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  return <Typography ref={ref} component={component} tabIndex={-1} sx={[{ outline: "none" }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...props} />
}
