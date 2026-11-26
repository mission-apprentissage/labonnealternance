"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import type { INewsletterJSON } from "shared/models/newsletter.model"

import { useToast } from "@/app/hooks/useToast"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { ApiError, apiDelete } from "@/utils/api.utils"

export function NewsletterDeleteModal({
  newsletter,
  isOpen,
  onClose,
  onDone,
}: {
  newsletter: INewsletterJSON | null
  isOpen: boolean
  onClose: () => void
  /** Appelé une fois la liste rechargée : la ligne, et le bouton qui a ouvert la modale, n'y sont plus. */
  onDone: () => void
}) {
  const toast = useToast()
  const titleId = useId()
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)

  if (!newsletter) return null

  const handleConfirm = async () => {
    setIsPending(true)
    try {
      await apiDelete("/admin/newsletters/:id", { params: { id: newsletter._id } })
      await queryClient.invalidateQueries({ queryKey: ["/admin/newsletters"] })
      toast({ title: `Infolettre « ${newsletter.title} » supprimée` })
      onClose()
      onDone()
    } catch (error) {
      const message = error instanceof ApiError && error.context?.statusCode >= 400 ? error.context.message : "Une erreur est survenue, merci de réessayer plus tard"
      toast({ title: message, variant: "error" })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose} ariaLabelledBy={titleId}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography id={titleId} component="h2" className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }}>
          Supprimer l'infolettre
        </Typography>
        <Typography sx={{ mb: fr.spacing("2v") }}>Vous êtes sur le point de supprimer l'infolettre « {newsletter.title} ».</Typography>
        <Typography sx={{ mb: fr.spacing("4v") }}>
          Elle disparaîtra de la page « La lettre de l'alternance ». Cette action est définitive. Pour la retirer temporairement, modifiez-la et décochez l'affichage.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: fr.spacing("3v") }}>
          <Button priority="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button iconId="fr-icon-delete-line" iconPosition="left" onClick={handleConfirm} disabled={isPending}>
            Supprimer l'infolettre
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
