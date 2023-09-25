import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { useState } from "react"

import { AUTHTYPE, USER_STATUS } from "../../common/contants"
import useUserHistoryUpdate from "../../common/hooks/useUserHistoryUpdate"
import { Close } from "../../theme/components/icons"
import { archiveDelegatedFormulaire, archiveFormulaire, updateEntreprise } from "../../utils/api"

export const ConfirmationDesactivationUtilisateur = (props) => {
  const { isOpen, onClose, establishment_raison_sociale, _id, type, establishment_id, siret } = props
  const [reason, setReason] = useState()
  const reasonComment = useDisclosure()
  const disableUser = useUserHistoryUpdate(_id, USER_STATUS.DISABLED, reason)
  const reassignUserToAdmin = useUserHistoryUpdate(_id, USER_STATUS.WAITING, reason)

  const handleReason = (value) => {
    if (value === "Autre") {
      reasonComment.onOpen()
    } else {
      reasonComment.onClose()
      setReason(value)
    }
  }

  const handleUpdate = async () => {
    switch (type) {
      case AUTHTYPE.ENTREPRISE:
        if (reason === "Ne relève pas des champs de compétences de mon OPCO") {
          await Promise.all([updateEntreprise(_id, establishment_id, { opco: "inconnu" }), reassignUserToAdmin()])
        } else {
          await Promise.all([archiveFormulaire(establishment_id), disableUser()])
        }
        break

      case AUTHTYPE.CFA:
        await Promise.all([archiveDelegatedFormulaire(siret), disableUser()])
        break
      default:
        throw new Error(`unsupported type: ${type}`)
    }
    onClose()
    reasonComment.onClose()
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
            Vous êtes sur le point de désactiver le compte de l’entreprise {establishment_raison_sociale}. Une fois le compte inactif, l’entreprise ne pourra plus accéder au
            service de dépot d’offres et modifier ses informations.
          </Text>
          <FormControl isRequired mt={5}>
            <FormLabel>Motif de refus</FormLabel>
            <Select onChange={(e) => handleReason(e.target.value)}>
              <option value="" hidden>
                Sélectionnez un motif
              </option>
              <option value="Ne relève pas des champs de compétences de mon OPCO">Ne relève pas des champs de compétences de mon OPCO</option>
              <option value="Tentative de fraude">Tentative de fraude</option>
              <option value="Injoignable">Injoignable</option>
              <option value="Compte en doublon">Compte en doublon</option>
              {type === "CFA" && <option value="Non référencé dans le catalogue">Non référencé dans le catalogue</option>}
              <option value="Autre">Autre</option>
            </Select>
          </FormControl>
        </ModalBody>

        {reasonComment.isOpen && (
          // @ts-expect-error: TODO
          <ModalBody isRequired>
            <FormLabel>Autre</FormLabel>
            <FormControl isRequired>
              {/* @ts-expect-error: TODO */}
              <Input onChange={(e) => setReason(e.target.value)} isRequired minLength="3" />
            </FormControl>
          </ModalBody>
        )}

        <ModalFooter>
          <Button
            variant="secondary"
            mr={3}
            onClick={() => {
              onClose()
              setReason(null)
            }}
          >
            Annuler
          </Button>
          <Button variant="primary" onClick={() => handleUpdate()} isDisabled={!reason}>
            Supprimer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ConfirmationDesactivationUtilisateur
