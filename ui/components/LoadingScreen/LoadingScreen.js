import { Box, Spinner, Text } from "@chakra-ui/react"
import React from "react"

const LoadingScreen = () => {
  return (
    <Box textAlign="center" width="100%" maxWidth="800px" m="auto" fontSize="2rem" p={12}>
      <Text>Chargement en cours, veuillez patienter :)</Text>
      <Box>
        <Spinner size="lg" thickness="4px" color="bluefrance.500" />
      </Box>
    </Box>
  )
}

export default LoadingScreen
