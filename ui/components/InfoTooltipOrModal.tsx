import { Text } from "@chakra-ui/react"
import { ReactElement } from "react"

import { useDisclosure } from "@/common/hooks/useDisclosure"

import { ModalReadOnly } from "./ModalReadOnly"

export const InfoTooltipOrModal = ({ tooltipContent, children }: { tooltipContent: React.ReactNode; children: ReactElement }) => {
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
