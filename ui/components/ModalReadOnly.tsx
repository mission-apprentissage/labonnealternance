import { Button, Modal, ModalBody, ModalContent, ModalContentProps, ModalOverlay, Text } from "@chakra-ui/react"

import { Close } from "@/theme/components/icons"

export const ModalReadOnly = ({
  children,
  isOpen,
  onClose,
  modalContentProps,
  hideCloseButton = false,
}: {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  modalContentProps?: ModalContentProps
  hideCloseButton?: boolean
}) => {
  const isMobile = () => window.innerWidth < 500
  return (
    <Modal closeOnOverlayClick={true} blockScrollOnMount={true} size={isMobile() ? "full" : "sm"} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent overflowY="auto" margin="auto" maxHeight={["100%", "95%"]} maxWidth={["100%", "95%"]} width="fit-content" borderRadius={0} {...modalContentProps} pt={0}>
        {!hideCloseButton && <ModalReadOnlyCloseButton onClick={onClose} />}
        <ModalBody padding={0}>{children}</ModalBody>
      </ModalContent>
    </Modal>
  )
}

export const ModalReadOnlyCloseButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      mt={4}
      mb={4}
      display={"flex"}
      alignSelf={"flex-end"}
      color="bluefrance.500"
      fontSize={"epsilon"}
      onClick={onClick}
      variant="unstyled"
      p={6}
      fontWeight={400}
      cursor="pointer"
    >
      Fermer
      <Text as="span" ml={2}>
        <Close boxSize={4} />
      </Text>
    </Button>
  )
}
