import { Image, Text } from "@chakra-ui/react"
import React from "react"

const tagProperties = {
  color: "greensoft.600",
  background: "greensoft.200",
}

const TagCfaDEntreprise = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src="/images/smiley.svg" alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        CFA d&apos;entreprise
      </Text>
    </Text>
  )
}

export default TagCfaDEntreprise
