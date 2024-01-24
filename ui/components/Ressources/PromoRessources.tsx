import { Box, Container, Image, Text } from "@chakra-ui/react"
import React from "react"

import Link from "../Link"

const PromoRessources = () => {
  return (
    <>
      <Container textAlign="center" variant="responsiveContainer">
        <Image margin="auto" src="/images/pages_ressources/outils.svg" alt="" />
        <Text fontSize={24} fontWeight={700}>
          La bonne alternance recense une liste d’outils et de liens utiles pour vous aider dans vos démarches de recherche d’alternance.
        </Text>
        <Box mt="7">
          <Link href="/ressources" color="#000091" border="1px solid #000091" padding="10px 24px">
            Découvrir les ressources
          </Link>
        </Box>
      </Container>
    </>
  )
}

export default PromoRessources
