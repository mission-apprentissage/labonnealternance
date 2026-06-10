import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useState } from "react"
import type { useDisclosure } from "@/common/hooks/useDisclosure"
import { ContactCfaSummary } from "@/components/espace_pro/Candidat/layout/ContactCfaSummary"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { DemandeDeContactConfirmation } from "./DemandeDeContactConfirmation"
import { DemandeDeContactForm } from "./DemandeDeContactForm"

export type DemandeDeContactContext = {
  cle_ministere_educatif: string
  etablissement_formateur_entreprise_raison_sociale: string
  intitule: string
  adresse: string
  codePostal: string
  ville: string
}

export const DemandeDeContactModal = ({
  context: { cle_ministere_educatif },
  context,
  referrer,
  onRdvSuccess,
  modalControls,
}: {
  context: DemandeDeContactContext
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
  context,
  context: { etablissement_formateur_entreprise_raison_sociale, intitule, adresse, codePostal, ville },
  referrer,
  onRdvSuccess,
}: {
  context: DemandeDeContactContext
  referrer: string
  onRdvSuccess: () => void
}) => {
  const [confirmation, setConfirmation] = useState<{ appointmentId: string; token: string } | null>(null)

  const localOnSuccess = (props: { appointmentId: string; token: string }) => {
    setConfirmation(props)
    onRdvSuccess()
  }

  return (
    <Box sx={{ p: fr.spacing("8v") }}>
      {confirmation ? (
        <DemandeDeContactConfirmation {...confirmation} />
      ) : (
        <>
          <ContactCfaSummary
            entrepriseRaisonSociale={etablissement_formateur_entreprise_raison_sociale}
            intitule={intitule}
            adresse={adresse}
            codePostal={codePostal}
            ville={ville}
            fromMail={false}
          />
          <DemandeDeContactForm context={context} onRdvSuccess={localOnSuccess} referrer={referrer} />
        </>
      )}
    </Box>
  )
}
