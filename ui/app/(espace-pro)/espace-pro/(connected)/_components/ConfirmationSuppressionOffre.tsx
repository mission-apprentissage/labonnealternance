import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"

import ClotureRecrutementForm, { type IClotureRecrutementPayload } from "@/app/(espace-pro)/_components/ClotureRecrutementForm"
import { useToast } from "@/app/hooks/useToast"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { cancelOffreFromAdmin } from "@/utils/api"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"

export interface ConfirmationSuppressionOffreProps {
  isOpen: boolean
  onClose: () => void
  offre: { _id: string }
}

export default function ConfirmationSuppressionOffre(props: ConfirmationSuppressionOffreProps) {
  const toast = useToast()
  const client = useQueryClient()
  const { isOpen, onClose, offre } = props

  const submit = async (offreId: string, payload: IClotureRecrutementPayload) => {
    await cancelOffreFromAdmin(offreId, payload)
    pushMatomoEvent({ event: MATOMO_EVENTS.OFFER_DELETE_CONFIRMED })
    toast({
      title: `Offre supprimée.`,
      description: "Votre offre a bien été mise à jour.",
    })
    await client.invalidateQueries({
      queryKey: ["offre-liste"],
    })
  }

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <ClotureRecrutementForm offreId={offre._id} onSuccess={onClose} onCancel={onClose} submit={submit} />
      </Box>
    </ModalReadOnly>
  )
}
