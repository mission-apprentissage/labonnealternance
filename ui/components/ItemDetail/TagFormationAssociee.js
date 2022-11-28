import React from "react"
import { Image, Text } from "@chakra-ui/react"

import bookIcon from "../../public/images/book.svg"

const tagProperties = {
  color: "greensoft.600",
  background: "greensoft.200",
}

const TagFormationAssociee = ({ isMandataire }) => {
  return (
    <>
      {isMandataire === true ? (
        <Text as="span" variant="tag" {...tagProperties}>
          <Image width="16px" mb="-2px" src={bookIcon} alt="" />
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
