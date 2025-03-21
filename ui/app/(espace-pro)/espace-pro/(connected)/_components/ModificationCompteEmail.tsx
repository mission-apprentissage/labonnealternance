import { Button, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"

import { apiGet } from "@/utils/api.utils"

export default function ModificationCompteEmail(props) {
  const { isOpen, onClose } = props
  const router = useRouter()

  const handleLogout = async () => {
    await apiGet("/auth/logout", {})
    router.push("/espace-pro/authentification")
  }

  return (
    <Modal closeOnOverlayClick={false} blockScrollOnMount={true} size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={["0", "3.75rem"]} h={["100%", "auto"]} mb={0} borderRadius={0}>
        <ModalHeader>
          <Heading as="h2" fontSize="1.5rem">
            <Text>Changement d'email détecté</Text>
          </Heading>
        </ModalHeader>
        <ModalBody pb={6}>
          <Text>Vous venez de modifier votre email. Vous allez être redirigé vers la page d'authentification.</Text>
          <Text pt={5}>Merci de vous connecter avec votre nouvel email.</Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleLogout}>
            Confirmer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
