import { Box, Button, Center, Flex, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { deleteCfa, deleteEntreprise } from "../api"
import { AUTHTYPE } from "../common/contants"
import { InfoCircle } from "../theme/components/icons"

export default (props) => {
  let { isOpen, onClose, user, formulaire } = props
  const navigate = useNavigate()

  const validateAccountCreation = () => {
    switch (user.type) {
      case AUTHTYPE.ENTREPRISE:
        navigate("/creation/offre", {
          replace: true,
          state: { id_form: formulaire.id_form, email: user.email, userId: user._id, displayBanner: true },
        })
        break
      case AUTHTYPE.CFA:
        navigate("/authentification/en-attente", { replace: true, state: { email: user.email, type: user.type } })
        break

      default:
        break
    }
    onClose()
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
            <Flex>
              <Text fontWeight="700">
                Votre adresse email <span style={{ color: "#000091", background: "#F5F5FE", padding: "5px 5px" }}>{user?.email}</span> n’est pas référencée dans nos bases de
                données.
              </Text>
            </Flex>
            <Text>Votre demande de création de compte va être vérifiée et validée avant que vos offres soient visibles en ligne.</Text>
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
