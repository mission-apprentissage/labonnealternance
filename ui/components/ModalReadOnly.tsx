import { Button, Modal, ModalBody, ModalContent, ModalContentProps, ModalOverlay, Text } from "@chakra-ui/react"

import { Close } from "@/theme/components/icons"

export const ModalReadOnly = ({
  children,
  isOpen,
  onClose,
  modalContentProps,
}: {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  modalContentProps?: ModalContentProps
}) => {
  return (
    <Modal closeOnOverlayClick={true} blockScrollOnMount={true} size="sm" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent overflowY="auto" margin="auto" maxHeight="calc(100% - 15px)" maxWidth="calc(100% - 15px)" width="fit-content" borderRadius={0} {...modalContentProps} pt={0}>
        <Button mt={4} mb={4} display={"flex"} alignSelf={"flex-end"} color="bluefrance.500" fontSize={"epsilon"} onClick={onClose} variant="unstyled" p={6} fontWeight={400}>
          Fermer
          <Text as="span" ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalBody padding={0}>{children}</ModalBody>
      </ModalContent>
    </Modal>
  )
}
