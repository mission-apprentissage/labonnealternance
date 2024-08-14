import { Box, Flex, Link, Text, Tooltip, useDisclosure } from "@chakra-ui/react"
import { useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { InterrogationCircle } from "@/theme/components/icons/InterrogationCircle"
import { reportLbaItem } from "@/utils/api"

import { ModalReadOnly } from "../ModalReadOnly"

import { useLocalStorageTyped } from "./CandidatureLba/services/useLocalStorage"

export const ReportJobLink = ({
  linkLabelNotReported,
  linkLabelReported,
  tooltip,
  itemId,
  width,
  type,
}: {
  itemId: string
  linkLabelNotReported: string
  linkLabelReported: string
  tooltip: React.ReactNode
  width: string
  type: LBA_ITEM_TYPE
}) => {
  const [isTooltipOpen, setTooltipOpen] = useState(false)
  const { isOpen: isModalOpen, onClose: onModalClose, onOpen: setModalOpen } = useDisclosure()
  const [isReported, setReported] = useLocalStorageTyped<boolean>(`report-job-${itemId}`, false)
  const isMobile = () => window.innerWidth < 500

  const onReport = async () => {
    if (isReported) {
      return
    }
    if (!confirm("Êtes-vous sûr de vouloir signaler cette offre comme frauduleuse ?")) {
      return
    }
    setReported(true)
    reportLbaItem(itemId, type)
  }

  const onClick = () => {
    if (isMobile()) {
      setModalOpen()
    }
  }

  const onMouseOver = () => {
    if (!isMobile()) {
      setTooltipOpen(true)
    }
  }

  const onMouseOut = () => {
    if (!isMobile()) {
      setTooltipOpen(false)
    }
  }

  return (
    <Flex alignItems="center" gap="16px">
      {isReported ? (
        <Text color="#18753C" fontSize="16px">
          ⚐ &nbsp;{linkLabelReported}
        </Text>
      ) : (
        <Link textDecoration="underline" color="#3A3A3A" fontSize="16px" onClick={onReport}>
          <span style={{ color: "#03053D" }}>⚐</span> &nbsp;{linkLabelNotReported}
        </Link>
      )}
      <ModalReadOnly isOpen={isModalOpen} onClose={onModalClose}>
        {tooltip}
      </ModalReadOnly>
      <Tooltip
        isOpen={isTooltipOpen}
        label={<Box padding="24px 46px 24px 24px">{tooltip}</Box>}
        openDelay={300}
        bg="white"
        color="grey.800"
        placement="top"
        width={width}
        minWidth={`min(${width}, 100vw)`}
      >
        <Text as={"span"} _hover={{ cursor: "pointer" }} color="#000091" onClick={onClick} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
          <InterrogationCircle />
        </Text>
      </Tooltip>
    </Flex>
  )
}
