"use client"

import { FormControl, FormLabel, Heading, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Text, useDisclosure } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useState } from "react"
import { IUserRecruteurJson } from "shared"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { useUserPermissionsActions } from "@/common/hooks/useUserPermissionsActions"

import { AUTHTYPE } from "../../common/contants"

const ConfirmationDesactivationUtilisateur = ({
  userRecruteur,
  onClose,
  isOpen,
  onUpdate,
}: { userRecruteur?: IUserRecruteurJson; onUpdate?: (props: { reason: string }) => void } & ReturnType<typeof useDisclosure>) => {
  const { establishment_raison_sociale, _id: _idObject, type } = userRecruteur ?? {}
  const _id = (_idObject ?? "").toString()
  const [reason, setReason] = useState<string>()
  const reasonComment = useDisclosure()
  const { deactivate: disableUser, waitsForValidation: reassignUserToAdmin } = useUserPermissionsActions(_id)

  if (!userRecruteur) return null

  const handleReason = (value: string) => {
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
        <ModalCloseButton onClose={onClose} />
        <ModalHeader>
          <Heading as="h2" mb={0} fontSize="1.5rem">
            Désactivation du compte
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text as="span">Vous êtes sur le point de désactiver le compte de l’entreprise {establishment_raison_sociale}. Pouvez-vous nous préciser pour quelle raison ?</Text>
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
              priority="secondary"
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
