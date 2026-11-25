"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"
import type { ReactNode } from "react"
import { useEffect, useRef } from "react"

export const formatApplicationDateTime = (date: string | Date | null) => (date ? dayjs(date).format("DD/MM/YYYY [à] HH:mm") : "")

/** Bandeau d'état d'une candidature, affiché à la place des actions de réponse (détail de l'espace pro, formulaire du mail). */
export const ApplicationStatusBanner = ({
  success = true,
  title,
  focusOnMount = false,
  children,
}: {
  success?: boolean
  title: string
  focusOnMount?: boolean
  children?: ReactNode
}) => {
  const ref = useRef<HTMLDivElement>(null)
  // Le bandeau remplace le bouton qui vient d'être activé : sans ce focus, le clavier repartirait du haut de la page.
  useEffect(() => {
    if (focusOnMount) ref.current?.focus()
  }, [focusOnMount])

  return (
    <Box ref={ref} tabIndex={focusOnMount ? -1 : undefined} sx={{ mt: fr.spacing("6v"), p: fr.spacing("6v"), backgroundColor: fr.colors.decisions.background.alt.grey.default }}>
      <Typography
        sx={{
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: fr.spacing("2v"),
          color: success ? fr.colors.decisions.text.default.success.default : fr.colors.decisions.text.default.error.default,
        }}
      >
        <span className={success ? "fr-icon-checkbox-circle-fill" : "fr-icon-error-fill"} aria-hidden="true" />
        {title}
      </Typography>
      {children}
    </Box>
  )
}

/** Bouton « Annuler » d'un bandeau d'état de l'espace pro, suivi de son message d'échec. */
export const StatusCancelAction = ({
  srLabel,
  errorMessage,
  onCancel,
  isCancelling,
  cancelFailed,
}: {
  srLabel: string
  errorMessage: string
  onCancel: () => void
  isCancelling: boolean
  cancelFailed: boolean
}) => (
  <>
    <Box sx={{ mt: fr.spacing("4v") }}>
      <Button priority="secondary" iconId="fr-icon-arrow-go-back-line" iconPosition="left" onClick={onCancel} disabled={isCancelling}>
        Annuler<span className="fr-sr-only"> {srLabel}</span>
      </Button>
    </Box>
    <Box role="alert" sx={{ mt: cancelFailed ? fr.spacing("4v") : 0 }}>
      {cancelFailed && <Alert severity="error" small description={errorMessage} />}
    </Box>
  </>
)

/**
 * Candidature que le recruteur a déclaré avoir traitée hors de LBA (#5769). Avec `onCancel`, le recruteur peut revenir
 * sur ce statut (espace pro) ; le formulaire ouvert depuis le mail ne le propose pas.
 */
export const TreatedElsewhereBanner = ({
  date,
  focusOnMount = false,
  onCancel,
  isCancelling = false,
  cancelFailed = false,
}: {
  date: string | Date | null
  focusOnMount?: boolean
  onCancel?: () => void
  isCancelling?: boolean
  cancelFailed?: boolean
}) => (
  <ApplicationStatusBanner title={date ? `Statut mis à jour le ${formatApplicationDateTime(date)}` : "Statut mis à jour"} focusOnMount={focusOnMount}>
    <Typography sx={{ mt: fr.spacing("2v") }}>Vous nous avez indiqué avoir répondu au candidat par un autre canal (mail ou téléphone).</Typography>
    {onCancel && (
      <StatusCancelAction
        srLabel="le statut « contacté par un autre canal »"
        errorMessage="L'annulation du statut a échoué. Veuillez réessayer."
        onCancel={onCancel}
        isCancelling={isCancelling}
        cancelFailed={cancelFailed}
      />
    )}
  </ApplicationStatusBanner>
)
