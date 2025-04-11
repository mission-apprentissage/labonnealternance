import { Box, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"

const ConfirmationActivationUtilisateur = (props) => {
  const { isOpen, onClose, establishment_raison_sociale, _id } = props
  const { activate } = useUserPermissionsActions(_id)

  const activateUser = async () => {
    await activate()
    onClose()
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
        <ModalCloseButton onClose={onClose} />
        <ModalHeader>
          <Heading as="h2" mb={0} fontSize="1.5rem">
            Activation du compte
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          Vous êtes sur le point d’activer le compte de l’entreprise {establishment_raison_sociale}. Une fois le compte validé, l’entreprise pourra accéder au service de dépot
          d’offres et modifier ses informations.
        </ModalBody>

        <ModalFooter>
          <Box mr={3}>
            <Button priority="secondary" onClick={() => onClose()}>
              Annuler
            </Button>
          </Box>
          <Button onClick={() => activateUser()}>Activer le compte</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ConfirmationActivationUtilisateur
