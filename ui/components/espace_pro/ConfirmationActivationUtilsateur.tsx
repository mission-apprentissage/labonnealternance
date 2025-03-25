import { Box, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"

import ModalCloseButton from "@/app/(espace-pro)/_components/ModalCloseButton"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"

export const ConfirmationActivationUtilsateur = (props) => {
  const { isOpen, onClose, establishment_raison_social, _id } = props
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
          <Heading as="h2" fontSize="1.5rem">
            <Text>Activation du compte</Text>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>
            Vous êtes sur le point d’activer le compte de l’entreprise {establishment_raison_social}. Une fois le compte validé, l’entreprise pourra accéder au service de dépot
            d’offres et modifier ses informations.
          </Text>
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

export default ConfirmationActivationUtilsateur
