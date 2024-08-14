import { Button, Modal, ModalBody, ModalContent, ModalOverlay, Text } from "@chakra-ui/react"

import { Close } from "@/theme/components/icons"

export const ModalReadOnly = ({ children, isOpen, onClose }: { children: React.ReactNode; isOpen: boolean; onClose: () => void }) => {
  return (
    <Modal closeOnOverlayClick={true} blockScrollOnMount={true} size="sm" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent margin="auto" maxHeight="95%" maxWidth="95%" width="fit-content" borderRadius={0}>
        <Button display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={onClose} variant="unstyled" p={6} fontWeight={400}>
          fermer
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalBody pb={6}>{children}</ModalBody>
      </ModalContent>
    </Modal>
  )
}
