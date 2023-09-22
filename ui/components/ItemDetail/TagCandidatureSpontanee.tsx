import { Image, Text } from "@chakra-ui/react"
import React from "react"

import briefcaseIcon from "../../public/images/briefcase.svg"

const tagProperties = {
  color: "pinksoft.600",
  background: "pinksoft.200",
}

const TagCandidatureSpontanee = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src={briefcaseIcon} alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        Candidature spontanée
      </Text>
    </Text>
  )
}

export default TagCandidatureSpontanee
