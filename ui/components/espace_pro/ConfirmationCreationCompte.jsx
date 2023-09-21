import { Box, Button, Center, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { AUTHTYPE } from "../../common/contants"
import { redirect } from "../../common/utils/router"
import { InfoCircle } from "../../theme/components/icons"
import { deleteCfa, deleteEntreprise } from "../../utils/api"

export const ConfirmationCreationCompte = (props) => {
  let { isOpen, onClose, user, formulaire } = props
  const router = useRouter()

  const validateAccountCreation = () => {
    switch (user.type) {
      case AUTHTYPE.ENTREPRISE:
        router.push({
          pathname: "/espace-pro/creation/offre",
          query: { establishment_id: formulaire.establishment_id, email: user.email, type: user.type, userId: user._id, displayBanner: true },
        })
        break
      case AUTHTYPE.CFA:
        router.push("/espace-pro/authentification/en-attente")
        break

      default:
        break
    }
    onClose()
  }

  const deleteAccount = async () => {
    if (user.type === AUTHTYPE.ENTREPRISE) {
      await deleteEntreprise(user._id, formulaire._id)
    } else {
      await deleteCfa(user._id)
    }
    redirect("/", true)
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
            <Text fontWeight="700">
              Votre demande de création de compte liée à l’adresse email <span style={{ color: "#000091", background: "#F5F5FE", padding: "5px 5px" }}>{user?.email}</span> va être
              vérifiée et validée avant que vos offres soient visibles en ligne.
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

export default ConfirmationCreationCompte
