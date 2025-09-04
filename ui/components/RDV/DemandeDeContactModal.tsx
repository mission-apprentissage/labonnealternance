import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useState } from "react"

import { useDisclosure } from "@/common/hooks/useDisclosure"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { DemandeDeContactConfirmation } from "@/components/RDV/DemandeDeContactConfirmation"
import { DemandeDeContactForm } from "@/components/RDV/DemandeDeContactForm"

export const DemandeDeContactModal = ({
  context: { cle_ministere_educatif },
  context,
  referrer,
  onRdvSuccess,
  modalControls,
}: {
  context: { cle_ministere_educatif: string; etablissement_formateur_entreprise_raison_sociale: string }
  referrer: string
  onRdvSuccess: () => void
  modalControls: ReturnType<typeof useDisclosure>
}) => {
  const { isOpen, onClose } = modalControls

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <DemandeDeContactBody key={cle_ministere_educatif} context={context} referrer={referrer} onRdvSuccess={onRdvSuccess} />
    </ModalReadOnly>
  )
}

const DemandeDeContactBody = ({
  context: { etablissement_formateur_entreprise_raison_sociale },
  context,
  referrer,
  onRdvSuccess,
}: {
  context: { cle_ministere_educatif: string; etablissement_formateur_entreprise_raison_sociale: string }
  referrer: string
  onRdvSuccess: () => void
}) => {
  const [confirmation, setConfirmation] = useState<{ appointmentId: string; token: string } | null>(null)

  const localOnSuccess = (props: { appointmentId: string; token: string }) => {
    setConfirmation(props)
    onRdvSuccess()
  }

  return (
    <Box sx={{ p: 1 }}>
      {confirmation ? (
        <DemandeDeContactConfirmation {...confirmation} />
      ) : (
        <>
          <Typography variant="h4" data-testid="DemandeDeContactFormTitle" sx={{ mb: fr.spacing("2w") }}>
            Contacter {etablissement_formateur_entreprise_raison_sociale}
          </Typography>
          <DemandeDeContactForm context={context} onRdvSuccess={localOnSuccess} referrer={referrer} />
        </>
      )}
    </Box>
  )
}
