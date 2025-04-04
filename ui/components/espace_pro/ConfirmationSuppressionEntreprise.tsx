import { Box, Flex, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useToast } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"

import ModalCloseButton from "@/app/_components/ModalCloseButton"

import { ArrowRightLine } from "../../theme/components/icons"
import { archiveFormulaire } from "../../utils/api"

export function ConfirmationSuppressionEntreprise(props) {
  const { isOpen, onClose, establishment_raison_sociale, establishment_id } = props
  const toast = useToast()

  const SupprimerFormulaire = () => {
    archiveFormulaire(establishment_id)
      .then(() => {
        toast({
          title: "Suppression réussie",
          description: "L'entreprise et ses offres ont bien été supprimée.",
          position: "top-right",
          status: "success",
          duration: 4000,
          isClosable: true,
        })
      })
      .finally(() => {
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      })
    onClose()
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
        <ModalCloseButton onClose={onClose} />
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Flex>
              <Text as={"span"}>
                <ArrowRightLine boxSize={26} />
              </Text>
              <Text as={"span"} ml={4}>
                Supprimer {establishment_raison_sociale ?? ""}
              </Text>
            </Flex>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>En supprimant cette entreprise, l’ensemble des offres créées pour celle-ci ne seront plus visibles.</ModalBody>

        <ModalFooter>
          <Box mr={3}>
            <Button priority="secondary" onClick={() => onClose()}>
              Annuler
            </Button>
          </Box>
          <Button onClick={() => SupprimerFormulaire()}>Supprimer</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
