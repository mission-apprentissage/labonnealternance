import { Image, Text } from "@chakra-ui/react"
import React from "react"

const tagProperties = {
  color: "greensoft.600",
  background: "greensoft.200",
}

const TagFormationAssociee = ({ isMandataire }) => {
  return (
    <>
      {isMandataire === true ? (
        <Text as="span" variant="tag" {...tagProperties}>
          <Image width="16px" mb="-2px" src="/images/book.svg" alt="" />
          <Text whiteSpace="nowrap" as="span" ml={1}>
            Formation associée
          </Text>
        </Text>
      ) : (
        ""
      )}
    </>
  )
}

export default TagFormationAssociee
