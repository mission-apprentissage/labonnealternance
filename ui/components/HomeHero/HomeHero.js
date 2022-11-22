import React from "react"
import StartForm from "../StartForm"
import { Container, Box } from "@chakra-ui/react"

const HomeHero = () => {
  return (
    <Box backgroundSize="contain" backgroundRepeat="no-repeat">
      <Container variant="responsiveContainer" pt={{ base: 3, sm: 12 }} pb={{ base: 0, sm: 12 }} position="relative">
        <Box boxShadow="0 4px 12px 2px rgb(0 0 0 / 21%)" pt="6" pb="10" bg="#fff" backgroundClip="border-box" borderRadius="10px">
          <StartForm />
        </Box>
      </Container>
    </Box>
  )
}

export default HomeHero
