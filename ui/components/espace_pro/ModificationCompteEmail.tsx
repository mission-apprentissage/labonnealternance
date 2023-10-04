import { Button, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from "@chakra-ui/react"

import useAuth from "../../common/hooks/useAuth"
import { redirect } from "../../common/utils/router"

export default function ModificationCompteEmail(props) {
  const { isOpen, onClose } = props
  const [, setAuth] = useAuth()

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Text>Changement d'email détcté</Text>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>Vous venez de modifier votre email. Vous allez être redirigé vers la page d'authentification.</Text>
          <Text pt={5}>Merci de vous connecter avec votre nouvel email.</Text>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => {
              setAuth(null)
              redirect("/espace-pro/authentification", true)
            }}
          >
            Confirmer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
