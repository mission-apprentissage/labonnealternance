import {
  Button as ChakraButton,
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
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useState } from "react"
import { IUserRecruteurJson } from "shared"

import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"

import { AUTHTYPE } from "../../common/contants"
import { Close } from "../../theme/components/icons"

export const ConfirmationDesactivationUtilisateur = ({
  userRecruteur,
  onClose,
  isOpen,
  onUpdate,
}: { userRecruteur?: IUserRecruteurJson; onUpdate?: (props: { reason: string }) => void } & ReturnType<typeof useDisclosure>) => {
  const { establishment_raison_sociale, _id: _idObject, type } = userRecruteur ?? {}
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
          await reassignUserToAdmin(reason)
        } else {
          await disableUser(reason)
        }
        break

      case AUTHTYPE.CFA:
      case AUTHTYPE.ADMIN:
        await disableUser(reason)
        break
      default:
        throw new Error(`unsupported type: ${type}`)
    }
    onUpdate?.({ reason })
    onClose()
    reasonComment.onClose()
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0} data-testid="confirmation-desactivation-utilisateur-modal">
        <ChakraButton display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={onClose} variant="unstyled" p={6} fontWeight={400}>
          fermer
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </ChakraButton>
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Text>Désactivation du compte</Text>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>Vous êtes sur le point de désactiver le compte de l’entreprise {establishment_raison_sociale}. Pouvez-vous nous préciser pour quelle raison ?</Text>
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
          <Box sx={{ marginRight: "10px" }}>
            <Button
              className="fr-btn--secondary"
              onClick={() => {
                onClose()
                setReason(null)
              }}
            >
              Annuler
            </Button>
          </Box>
          <Button onClick={() => handleUpdate()} disabled={!reason}>
            Supprimer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ConfirmationDesactivationUtilisateur
