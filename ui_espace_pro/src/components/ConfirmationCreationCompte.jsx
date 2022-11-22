import { Box, Button, Center, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { deleteCfa, deleteEntreprise } from "../api"
import { AUTHTYPE } from "../common/contants"
import { InfoCircle } from "../theme/components/icons"

export default (props) => {
  let { isOpen, onClose, user, formulaire } = props
  const navigate = useNavigate()

  const validateAccountCreation = () => {
    onClose()
    navigate("/authentification/en-attente", { state: { email: user.email } })
  }

  const deleteAccount = () => {
    if (user.type === AUTHTYPE.ENTREPRISE) {
      deleteEntreprise(user._id, formulaire._id).then(() => {
        window.location.replace("/")
      })
    } else {
      deleteCfa(user._id).then(() => {
        window.location.replace("/")
      })
    }
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="3xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} borderRadius={0}>
        <ModalHeader mt={5}>
          <Heading as="h2" fontSize="1.5rem">
            Confirmez votre demande de création de compte
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Stack direction="column" spacing={4}>
            <Text fontWeight="700">Vous avez renseigné une adresse email qui n’est pas référencée dans nos bases de données.</Text>
            <Text>
              En utilisant cette adresse email, votre demande de création de compte devra être vérifiée et validée par nos équipes avant que puissiez utiliser le service.
            </Text>
            <Text>Cela peut prendre quelques jours. Vous serez notifié dès que votre demande sera validée.</Text>
            <Box bg="#EEEEEE" h="62px">
              <Center h="100%">
                <InfoCircle mr={2} mt={1} color="bluefrance.500" w="20px" h="20px" />
                <Text>En annulant la création de compte, vos données seront définitivement supprimées.</Text>
              </Center>
            </Box>
          </Stack>
        </ModalBody>

        <ModalFooter mb={3}>
          <Button variant="secondary" mr={3} onClick={deleteAccount}>
            Annuler
          </Button>
          <Button variant="primary" onClick={validateAccountCreation}>
            Envoyer ma demande
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
