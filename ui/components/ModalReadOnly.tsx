"use client"
import { Modal, ModalBody, ModalContent, ModalContentProps, ModalOverlay } from "@chakra-ui/react"
import Button from "@codegouvfr/react-dsfr/Button"
import { useEffect } from "react"

import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { useIsMobileDevice } from "@/app/hooks/useIsMobileDevice"

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
  const isMobile = useIsMobileDevice()

  useEffect(() => {
    window.document.body.className = isOpen ? "is-modal-opened" : ""
  }, [isOpen])

  return (
    <Modal closeOnOverlayClick={true} blockScrollOnMount={true} size={isMobile ? "full" : "sm"} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent overflowY="auto" margin="auto" maxHeight={["100%", "95%"]} maxWidth={["100%", "95%"]} width="fit-content" borderRadius={0} {...modalContentProps} pt={0}>
        {!hideCloseButton && <ModalCloseButton onClose={onClose} />}
        <ModalBody padding={0}>{children}</ModalBody>
      </ModalContent>
    </Modal>
  )
}

export const ModalReadOnlyCloseButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick} style={{ cursor: "pointer" }} priority="tertiary no outline" iconId="ri-close-large-line" iconPosition="right">
      Fermer
    </Button>
  )
}
