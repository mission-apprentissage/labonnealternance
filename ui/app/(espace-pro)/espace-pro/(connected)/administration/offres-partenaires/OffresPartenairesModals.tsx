"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Typography } from "@mui/material"
import { useState } from "react"
import type { IJobsPartnersOfferForAdminJSON } from "shared/models/jobs-partners.model"
import { useJobsPartnersAdminActions } from "@/app/hooks/use-jobs-partners-admin-actions"
import { ModalReadOnly } from "@/components/ModalReadOnly"

export function ConfirmationDesactivationOffre({ offer, isOpen, onClose }: { offer: IJobsPartnersOfferForAdminJSON | null; isOpen: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("")
  const { deactivate } = useJobsPartnersAdminActions()

  if (!offer) return null

  const handleClose = () => {
    setReason("")
    onClose()
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={handleClose}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }} component="h2">
          Désactivation de l'offre
        </Typography>
        <Typography sx={{ mb: fr.spacing("2v"), color: "#3A3A3A", lineHeight: "24px" }}>
          Vous êtes sur le point de désactiver l'offre « {offer.offer_title} ». Pouvez-vous préciser pour quelle raison ?
        </Typography>
        <Input label="Raison de la désactivation" nativeTextAreaProps={{ value: reason, onChange: (e) => setReason(e.target.value), rows: 3 }} textArea />
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box sx={{ mr: fr.spacing("3v") }}>
            <Button priority="secondary" onClick={handleClose}>
              Annuler
            </Button>
          </Box>
          <Button
            disabled={!reason.trim()}
            onClick={async () => {
              await deactivate(offer._id, reason.trim())
              handleClose()
            }}
          >
            Désactiver l'offre
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}

export function ConfirmationClassificationOffre({ offer, isOpen, onClose }: { offer: IJobsPartnersOfferForAdminJSON | null; isOpen: boolean; onClose: () => void }) {
  const { setClassification } = useJobsPartnersAdminActions()

  if (!offer) return null

  const isCfaFlagged = offer.classification?.human_verification === "unpublish"
  const nextClassification = isCfaFlagged ? "publish" : "unpublish"

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }} component="h2">
          {isCfaFlagged ? "Retirer le signalement CFA" : "Signaler comme offre de CFA"}
        </Typography>
        <Typography sx={{ mb: fr.spacing("2v"), color: "#3A3A3A", lineHeight: "24px" }}>
          {isCfaFlagged
            ? `Vous êtes sur le point de retirer le signalement CFA de l'offre « ${offer.offer_title} ».`
            : `Vous êtes sur le point de signaler l'offre « ${offer.offer_title} » comme provenant d'un CFA.`}{" "}
          Si le modèle de classification automatique juge l'offre différemment, elle sera automatiquement annulée et repassée dans le pipeline de traitement.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: fr.spacing("3v") }}>
          <Box sx={{ mr: fr.spacing("3v") }}>
            <Button priority="secondary" onClick={onClose}>
              Annuler
            </Button>
          </Box>
          <Button
            onClick={async () => {
              await setClassification(offer._id, nextClassification)
              onClose()
            }}
          >
            {isCfaFlagged ? "Retirer le signalement" : "Signaler comme CFA"}
          </Button>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
