import { Image, Text } from "@chakra-ui/react"
import React from "react"

import briefcaseIcon from "../../public/images/briefcase.svg"

const tagProperties = {
  color: "orangeterrebattue.370",
  background: "orangeterrebattue.925",
}

const TagOffreEmploi = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src={briefcaseIcon} alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        Offre d&apos;emploi
      </Text>
    </Text>
  )
}

export default TagOffreEmploi
