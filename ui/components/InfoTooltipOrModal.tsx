import { Box, Text, Tooltip, useDisclosure } from "@chakra-ui/react"
import { useState } from "react"

import { ModalReadOnly } from "./ModalReadOnly"

export const InfoTooltipOrModal = ({
  tooltipContent,
  tooltipWidth,
  children,
  modalWidthLimit = 500,
}: {
  tooltipContent: React.ReactNode
  tooltipWidth: string
  children: React.ReactNode
  modalWidthLimit?: number
}) => {
  const [isTooltipClickedControlled, setTooltipClickedControlled] = useState(false)
  const [isMouseOver, setMouseOver] = useState(false)
  const [isTooltipOpen, setTooltipOpen] = useState(false)
  const { isOpen: isModalOpen, onClose: closeModal, onOpen: openModal } = useDisclosure()
  const isMobile = () => window.innerWidth < modalWidthLimit

  const onClick = () => {
    if (isMobile()) {
      if (isModalOpen) {
        closeModal()
      } else {
        openModal()
      }
    } else {
      setTooltipClickedControlled(true)
      setTooltipOpen(!isTooltipOpen)
    }
  }

  const onMouseOver = () => {
    setMouseOver(true)
  }

  const onMouseOut = () => {
    setMouseOver(false)
  }
  const isMobileBool = isMobile()

  return (
    <>
      <ModalReadOnly
        isOpen={isModalOpen && isMobileBool}
        onClose={closeModal}
        modalContentProps={{
          padding: 6,
        }}
      >
        {tooltipContent}
      </ModalReadOnly>
      <Tooltip
        isOpen={(isTooltipClickedControlled ? isTooltipOpen : isMouseOver) && !isMobileBool}
        label={<Box padding="24px 46px 24px 24px">{tooltipContent}</Box>}
        openDelay={300}
        bg="white"
        color="grey.800"
        placement="top"
        width={tooltipWidth}
        minWidth={`min(${tooltipWidth}, 100vw)`}
      >
        <Text as={"span"} _hover={{ cursor: "pointer" }} onClick={onClick} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
          {children}
        </Text>
      </Tooltip>
    </>
  )
}
