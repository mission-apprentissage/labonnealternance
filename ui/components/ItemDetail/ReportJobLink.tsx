import { Box, Flex, Link, Text, Tooltip } from "@chakra-ui/react"
import { useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { InterrogationCircle } from "@/theme/components/icons/InterrogationCircle"
import { reportLbaItem } from "@/utils/api"

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
  const [isReported, setReported] = useLocalStorageTyped<boolean>(`report-job-${itemId}`, false)

  const onReport = async () => {
    if (isReported) {
      return
    }
    setReported(true)
    reportLbaItem(itemId, type)
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
        <Text
          as={"span"}
          _hover={{ cursor: "pointer" }}
          color="#000091"
          onClick={() => setTooltipOpen(!isTooltipOpen)}
          onMouseOver={() => setTooltipOpen(true)}
          onMouseOut={() => setTooltipOpen(false)}
        >
          <InterrogationCircle />
        </Text>
      </Tooltip>
    </Flex>
  )
}
