import React from "react"
import bookIcon from "public/images/book.svg"
import { Image, Text } from "@chakra-ui/react"

const tagProperties = {
  color: "greensoft.600",
  background: "greensoft.200",
}

const TagFormation = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src={bookIcon} alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        Formation
      </Text>
    </Text>
  )
}

export default TagFormation
