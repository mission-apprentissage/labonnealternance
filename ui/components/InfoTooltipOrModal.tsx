import { Text, useDisclosure } from "@chakra-ui/react"

import { ModalReadOnly } from "./ModalReadOnly"

export const InfoTooltipOrModal = ({ tooltipContent, children }: { tooltipContent: React.ReactNode; children: React.ReactNode }) => {
  const { isOpen: isModalOpen, onClose: closeModal, onOpen: openModal } = useDisclosure()

  const onClick = () => {
    if (isModalOpen) {
      closeModal()
    } else {
      openModal()
    }
  }

  return (
    <>
      <ModalReadOnly
        isOpen={isModalOpen /* && isMobileBool*/}
        onClose={closeModal}
        modalContentProps={{
          padding: 6,
        }}
      >
        {tooltipContent}
      </ModalReadOnly>
      <Text as={"span"} _hover={{ cursor: "pointer" }} onClick={onClick}>
        {children}
      </Text>
    </>
  )
}
