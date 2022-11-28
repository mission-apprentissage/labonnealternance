import { Image, Text } from "@chakra-ui/react"
import React from "react"

import paperplaneIcon from "../../public/images/paperplane.svg"

const tagProperties = {
  color: "pinksoft.600",
  background: "pinksoft.200",
}

const TagCandidatureSpontanee = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src={paperplaneIcon} alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        Candidature spontanée
      </Text>
    </Text>
  )
}

export default TagCandidatureSpontanee
