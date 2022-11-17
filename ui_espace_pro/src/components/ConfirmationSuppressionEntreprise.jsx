import { Button, Flex, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useToast } from "@chakra-ui/react"
import { archiveFormulaire } from "../api"
import { ArrowRightLine, Close } from "../theme/components/icons"

export default (props) => {
  let { isOpen, onClose, raison_sociale, id_form } = props
  const toast = useToast()

  const SupprimerFormulaire = () => {
    archiveFormulaire(id_form)
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
        <Button display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={onClose} variant="unstyled" p={6} fontWeight={400}>
          fermer
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Flex>
              <Text as={"span"}>
                <ArrowRightLine boxSize={26} />
              </Text>
              <Text as={"span"} ml={4}>
                Supprimer {raison_sociale ?? ""}
              </Text>
            </Flex>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>En supprimant cette entreprise, l’ensemble des offres créées pour celle-ci ne seront plus visibles.</ModalBody>

        <ModalFooter>
          <Button variant="secondary" mr={3} onClick={() => onClose()}>
            Annuler
          </Button>
          <Button variant="primary" onClick={() => SupprimerFormulaire()}>
            Supprimer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
