import { Box, Image, SimpleGrid, Text } from "@chakra-ui/react"
import React from "react"

const ReseauEntreprise = () => {
  return (
    <Box as="section" py={3} mb={{ base: "2", md: "8" }}>
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px" alignItems={"center"} mt={12}>
        <Box>
          <Image src="/images/home_pics/illu-miseenrelation.svg" alt=""></Image>
        </Box>
        <Box>
          <Text as="h2" variant="homeEditorialH2">
            Développez votre réseau d’entreprises partenaires pour accompagner au mieux vos candidats en recherche de contrat
          </Text>
          <Text>Recevez des demandes de contact d’entreprises en recherche d’alternants.</Text>
        </Box>
      </SimpleGrid>
    </Box>
  )
}

export default ReseauEntreprise
