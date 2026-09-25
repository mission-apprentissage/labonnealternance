"use client"

import type { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { IFeedbackFormForAdminJSON } from "shared/models/feedback-form.model"

import { useToast } from "@/app/hooks/useToast"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { ApiError, apiDelete, apiPost } from "@/utils/api.utils"

export type IFeedbackFormAction = "delete" | "archive"

const TITLE_ID = "confirmation-action-formulaire-titre"

const ACTIONS: Record<
  IFeedbackFormAction,
  {
    title: string
    confirmLabel: string
    iconId: FrIconClassName | RiIconClassName
    description: (form: IFeedbackFormForAdminJSON) => string[]
    success: (form: IFeedbackFormForAdminJSON) => string
    run: (slug: string) => Promise<unknown>
  }
> = {
  delete: {
    title: "Supprimer le formulaire",
    confirmLabel: "Supprimer le formulaire",
    iconId: "fr-icon-delete-line",
    description: (form) => [
      form.status === "archived"
        ? `Vous êtes sur le point de supprimer le formulaire archivé « ${form.title} ».`
        : `Vous êtes sur le point de supprimer le brouillon « ${form.title} ».`,
      "Cette action est définitive : le formulaire et ses questions ne pourront pas être récupérés.",
    ],
    success: (form) => `Formulaire « ${form.title} » supprimé`,
    run: (slug) => apiDelete("/admin/feedback-forms/:slug", { params: { slug } }),
  },
  archive: {
    title: "Archiver le formulaire",
    confirmLabel: "Archiver le formulaire",
    iconId: "fr-icon-archive-line",
    description: (form) => [
      `Vous êtes sur le point d'archiver le formulaire « ${form.title} ».`,
      "Il ne sera plus affiché aux usagers et ne pourra plus être modifié. Cette action est définitive.",
      "Le formulaire et ses réponses restent consultables dans la liste, avec le filtre de statut « Archivés ».",
    ],
    success: (form) => `Formulaire « ${form.title} » archivé`,
    run: (slug) => apiPost("/admin/feedback-forms/:slug/archive", { params: { slug } }),
  },
}

export function ConfirmationActionFormulaire({
  form,
  action,
  isOpen,
  onClose,
  onDone,
}: {
  form: IFeedbackFormForAdminJSON | null
  action: IFeedbackFormAction
  isOpen: boolean
  onClose: () => void
  /** Appelé une fois la liste rechargée : la ligne, et le bouton qui a ouvert la modale, n'y sont plus. */
  onDone: () => void
}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)

  if (!form) return null

  const config = ACTIONS[action]

  const handleConfirm = async () => {
    setIsPending(true)
    try {
      await config.run(form.slug)
      await queryClient.invalidateQueries({ queryKey: ["/admin/feedback-forms"] })
      toast({ title: config.success(form) })
      onClose()
      onDone()
    } catch (error) {
      const message = error instanceof ApiError && error.context?.statusCode >= 400 ? error.context.message : "Une erreur est survenue, merci de réessayer plus tard"
      toast({ title: message, variant: "error" })
    } finally {
      setIsPending(false)
    }
  }

  const paragraphs = config.description(form)

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose} labelledBy={TITLE_ID}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography id={TITLE_ID} component="h2" className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }}>
          {config.title}
        </Typography>
        {paragraphs.map((paragraph, index) => (
          <Typography key={paragraph} sx={{ mb: fr.spacing(index === paragraphs.length - 1 ? "4v" : "2v") }}>
            {paragraph}
          </Typography>
        ))}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: fr.spacing("3v") }}>
          <Button priority="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button iconId={config.iconId} iconPosition="left" onClick={handleConfirm} disabled={isPending}>
            {config.confirmLabel}
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
