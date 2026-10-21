"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import type { CustomContentProps } from "notistack"
import { SnackbarContent } from "notistack"
import { forwardRef } from "react"

// Remplace MaterialDesignContent, qui code role="alert" en dur. Le toast n'est pas une zone live :
// l'annonce passe par ToastAnnouncer (RGAA 7.5), d'où role={undefined} sur l'Alert DSFR.
export const ToastContent = forwardRef<HTMLDivElement, CustomContentProps>(function ToastContent({ message, variant, style, className }, ref) {
  return (
    <SnackbarContent ref={ref} style={style} className={className}>
      <Alert
        small
        severity={variant === "default" ? "info" : variant}
        role={undefined}
        description={message}
        // fr-alert--sm a 1v de padding bas contre 2v en haut : on aligne le bas sur le haut pour centrer le texte
        style={{
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          boxShadow: "0 6px 18px rgba(0, 0, 18, 0.16)",
          maxWidth: 400,
          paddingBottom: fr.spacing("2v"),
        }}
      />
    </SnackbarContent>
  )
})
