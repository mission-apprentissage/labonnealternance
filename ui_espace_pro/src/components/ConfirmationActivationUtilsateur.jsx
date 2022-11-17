import { Button, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from "@chakra-ui/react"
import { USER_STATUS } from "../common/contants"
import useUserHistoryUpdate from "../common/hooks/useUserHistoryUpdate"
import { Close } from "../theme/components/icons"

export default (props) => {
  let { isOpen, onClose, raison_sociale, _id } = props
  const updateUserHistory = useUserHistoryUpdate(_id, USER_STATUS.ACTIVE)

  const activateUser = () => {
    updateUserHistory()
    onClose()
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
        <Button display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={onClose} variant="unstyled" p={6} fontWeight={400}>
          fermer
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Text>Activation du compte</Text>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>
            Vous êtes sur le point d’activer le compte de l’entreprise {raison_sociale}. Une fois le compte validé, l’entreprise pourra accéder au service de dépot d’offres et
            modifier ses informations.
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" mr={3} onClick={() => onClose()}>
            Annuler
          </Button>
          <Button variant="primary" onClick={() => activateUser()}>
            Activer le compte
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
