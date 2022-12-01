import React from "react"
import { Box, Image, Text, SimpleGrid } from "@chakra-ui/react"

const ReseauEntreprise = () => {
  return (
    <Box as="section" p={3} mb={{ base: "2", md: "8" }}>
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px" alignItems={"center"} mt={12}>
        <Box>
          <Image src="/images/home_pics/illu-miseenrelation.svg" alt=""></Image>
        </Box>
        <Box pl={{ base: 5 }}>
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
