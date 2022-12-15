import React from "react"
import { Box, Image, SimpleGrid, Text, Show } from "@chakra-ui/react"

const GerezOffres = () => {
  return (
    <Box as="section" py={24} backgroundColor="white">
      <Box py={12} backgroundColor="grey.100" px={{ base: 12, md: 10 }} borderRadius={10}>
        <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px">
          <Show above="md">
            <Box>&nbsp;</Box>
          </Show>
          <Box>
            <Box as="span" background="linear-gradient(90deg,#6a11cb,#2575fc)" color="#fff" borderRadius="80" lineHeight="32px" px={9} py={2} fontSize="20px" fontWeight="700">
              Bientôt
            </Box>
          </Box>
        </SimpleGrid>
        <Box>&nbsp;</Box>
        <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px">
          <Box>
            <Image src="/images/home_pics/illu-candidatures.svg" alt="" />
          </Box>
          <Box>
            <Box>
              <Text as="h2" variant="homeEditorialH2" mb={{ base: "1", lg: "2" }}>
                Gérez vos offres de manière collaborative
              </Text>
              <Box variant="homeEditorialText">Un accès multi-comptes permettra à plusieurs personnes de votre entreprise d’accéder et de gérer vos offres d&apos;emploi.</Box>
            </Box>
            <Box mt={{ base: "2", lg: "5" }}>
              <Text as="h2" variant="homeEditorialH2" mb={{ base: "1", lg: "2" }}>
                Consultez et gérez vos candidatures
              </Text>
              <Box variant="homeEditorialText">Vérifiez d&apos;un coup d&apos;œil la progression des candidatures pour définir les prochaines étapes.</Box>
            </Box>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  )
}

export default GerezOffres
