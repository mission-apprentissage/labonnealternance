import { Box, Modal, ModalBody, ModalContent, ModalOverlay, Text, useDisclosure } from "@chakra-ui/react"
import { useState } from "react"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
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
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} size={["full", "full", "full", "3xl"]}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton onClose={onClose} />
        <ModalBody data-testid="modalbody-contact-confirmation">
          <DemandeDeContactBody key={cle_ministere_educatif} context={context} referrer={referrer} onRdvSuccess={onRdvSuccess} />
        </ModalBody>
      </ModalContent>
    </Modal>
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
    <Box mx={confirmation ? [0, 0, 12, 12] : [0, 0, 4, 4]}>
      {confirmation ? (
        <DemandeDeContactConfirmation {...confirmation} />
      ) : (
        <>
          <Text as="h1" fontWeight={700} fontSize="24px" data-testid="DemandeDeContactFormTitle" mb={4}>
            Contacter {etablissement_formateur_entreprise_raison_sociale}
          </Text>
          <DemandeDeContactForm context={context} onRdvSuccess={localOnSuccess} referrer={referrer} />
        </>
      )}
    </Box>
  )
}
