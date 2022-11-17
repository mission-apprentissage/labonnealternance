import { Button, FormControl, FormLabel, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Text } from "@chakra-ui/react"
import { useState } from "react"
import { USER_STATUS } from "../common/contants"
import useUserHistoryUpdate from "../common/hooks/useUserHistoryUpdate"
import { Close } from "../theme/components/icons"

export default (props) => {
  const { isOpen, onClose, raison_sociale, _id } = props
  const [motif, setMotif] = useState()
  const disableUser = useUserHistoryUpdate(_id, USER_STATUS.DISABLED, motif)

  const handleUpdate = () => {
    disableUser()
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
            <Text>Désactivation du compte</Text>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>
            Vous êtes sur le point de désactiver le compte de l’entreprise {raison_sociale}. Une fois le compte inactif, l’entreprise ne pourra plus accéder au service de dépot
            d’offres et modifier ses informations.
          </Text>
          <FormControl isRequired mt={5}>
            <FormLabel>Motif de refus</FormLabel>
            <Select onChange={(e) => setMotif(e.target.value)}>
              <option value="" hidden>
                Sélectionnez un motif
              </option>
              <option value="Ne relève pas des champs de compétences de mon OPCO">Ne relève pas des champs de compétences de mon OPCO</option>
              <option value="Information utilisateur non conforme">Information utilisateur non conforme</option>
              <option value="Tentative de fraude">Tentative de fraude</option>
              <option value="Autre">Autre</option>
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="secondary"
            mr={3}
            onClick={() => {
              onClose()
              setMotif(null)
            }}
          >
            Annuler
          </Button>
          <Button variant="primary" onClick={() => handleUpdate()} isDisabled={!motif}>
            Supprimer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
