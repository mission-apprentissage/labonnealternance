import { Button, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text } from "@chakra-ui/react"

import { Close } from "../../theme/components/icons"

export default function ConfirmationModificationOpco(props) {
  const { isOpen, onClose, setFieldValue, previousValue, newValue, establishment_raison_sociale } = props

  const handleUpdate = () => {
    setFieldValue("opco", newValue)
    onClose()
  }

  const handleClose = () => {
    setFieldValue("opco", previousValue)
    onClose()
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
        <Button display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={onClose} variant="unstyled" p={6} fontWeight={400}>
          Fermer
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Text>Changement d’OPCO pour l’entreprise {establishment_raison_sociale}</Text>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>Vous vous apprêtez à modifier l’OPCO de rattachement de cette entreprise, cela signifie que cette entreprise n’apparaîtra plus dans votre console de gestion.</Text>
          <Stack direction="column" spacing={3} pt={4}>
            <Stack direction="row" align="center">
              <Text mr={3}>Ancien OPCO :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" mr={2} fontWeight={700} noOfLines={1}>
                {previousValue}
              </Text>
            </Stack>
            <Stack direction="row" align="center">
              <Text mr={3}>Nouvel OPCO :</Text>
              <Text bg="#F9F8F6" px="8px" py="2px" fontWeight={700} noOfLines={1} maxW="70%">
                {newValue}
              </Text>
            </Stack>
            <Text fontWeight="700">Êtes-vous sûr de vouloir poursuivre ?</Text>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" mr={3} onClick={() => handleClose()}>
            Annuler
          </Button>
          <Button variant="primary" onClick={() => handleUpdate()}>
            Confirmer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
