import { Box } from "@chakra-ui/react"
import React from "react"

const InfoBanner = ({ temp, color }) => {
  return <Box backgroundColor={color}>{temp}</Box>
}

export default InfoBanner
