"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import type { CustomContentProps } from "notistack"
import { SnackbarContent } from "notistack"
import { forwardRef } from "react"

// Remplace MaterialDesignContent, qui code role="alert" en dur : un succès est restitué en
// role="status" et n'interrompt pas la lecture (RGAA 7.5). Le rôle est porté par le conteneur,
// l'Alert DSFR n'en a pas (role={undefined}) pour ne pas imbriquer deux zones live.
export const ToastContent = forwardRef<HTMLDivElement, CustomContentProps>(function ToastContent({ message, variant, style, className }, ref) {
  return (
    <SnackbarContent ref={ref} role={variant === "error" || variant === "warning" ? "alert" : "status"} style={style} className={className}>
      <Alert
        small
        severity={variant === "default" ? "info" : variant}
        role={undefined}
        description={message}
        style={{ backgroundColor: fr.colors.decisions.background.default.grey.default, boxShadow: "0 6px 18px rgba(0, 0, 18, 0.16)", maxWidth: 400 }}
      />
    </SnackbarContent>
  )
})
