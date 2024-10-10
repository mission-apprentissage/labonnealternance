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
import { IUserRecruteurJson } from "shared"
import { OPCOS_LABEL } from "shared/constants"

import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"

import { AUTHTYPE } from "../../common/contants"
import { Close } from "../../theme/components/icons"
import { archiveDelegatedFormulaire, archiveFormulaire, updateEntrepriseAdmin } from "../../utils/api"

export const ConfirmationDesactivationUtilisateur = ({
  userRecruteur,
  onClose,
  isOpen,
  onUpdate,
}: { userRecruteur?: IUserRecruteurJson; onUpdate?: () => void } & ReturnType<typeof useDisclosure>) => {
  const { establishment_raison_sociale, _id: _idObject, type, establishment_id, establishment_siret } = userRecruteur ?? {}
  const _id = (_idObject ?? "").toString()
  const [reason, setReason] = useState()
  const reasonComment = useDisclosure()
  const { deactivate: disableUser, waitsForValidation: reassignUserToAdmin } = useUserPermissionsActions(_id)

  if (!userRecruteur) return null

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
          await Promise.all([updateEntrepriseAdmin(_id, { opco: OPCOS_LABEL.UNKNOWN_OPCO }, establishment_siret), reassignUserToAdmin(reason)])
        } else {
          await Promise.all([archiveFormulaire(establishment_id), disableUser(reason)])
        }
        break

      case AUTHTYPE.CFA:
        await Promise.all([archiveDelegatedFormulaire(establishment_siret), disableUser(reason)])
        break
      case AUTHTYPE.ADMIN:
        await disableUser(reason)
        break
      default:
        throw new Error(`unsupported type: ${type}`)
    }
    onUpdate?.()
    onClose()
    reasonComment.onClose()
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0} data-testid="confirmation-desactivation-utilisateur-modal">
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
              {type === "CFA" && <option value="Non référencé dans le catalogue du Réseau des Carif-Oref">Non référencé dans le catalogue</option>}
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
