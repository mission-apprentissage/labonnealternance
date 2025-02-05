import { Flex, Text } from "@chakra-ui/react"

import InfoTooltip from "./InfoToolTip"

export const FieldWithValue = ({
  title,
  value,
  hideIfEmpty = false,
  tooltip,
}: {
  title: React.ReactNode
  value: React.ReactNode
  tooltip?: React.ReactNode
  hideIfEmpty?: boolean
}) => {
  const isValueEmpty = value === null || value === undefined
  if (hideIfEmpty && isValueEmpty) {
    return null
  }
  return (
    <Flex align="center">
      <Text mr={3} minW="fit-content">
        {title} :
      </Text>
      {!isValueEmpty ? (
        <Text bg="#F9F8F6" px={2} py="2px" mr={2} fontWeight={700} noOfLines={1}>
          {value}
        </Text>
      ) : (
        <Text textTransform="uppercase" bg="#FFE9E9" textColor="#CE0500" px={2} py="2px" fontWeight={700} mr={2} noOfLines={1}>
          Non identifié
        </Text>
      )}
      {tooltip && (typeof tooltip === "string" ? <InfoTooltip description={tooltip} /> : tooltip)}
    </Flex>
  )
}
