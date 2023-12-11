import { Box, Image, Link, SimpleGrid, Text } from "@chakra-ui/react"
import React from "react"

const OffresGratuites = () => {
  return (
    <Box as="section" py={3} mb={{ base: "2", md: "5" }}>
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px" alignItems={"center"} mt={12}>
        <Box>
          <Text as="h2" variant="homeEditorialH2" mb={{ base: "3", lg: "5" }}>
            Vos offres sont diffusées gratuitement au plus près des candidats
          </Text>
          {/* @ts-expect-error: TODO */}
          <Box variant="homeEditorialText">
            Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
            <Link variant="homeEditorialLink" aria-label="Redirection vers la page d'accueil" href="https://labonnealternance.apprentissage.beta.gouv.fr" isExternal>
              La bonne alternance
            </Link>
            ,{" "}
            <Link variant="homeEditorialLink" aria-label="Accès au site un jeune une solution" href="https://www.1jeune1solution.gouv.fr" isExternal>
              1jeune1solution
            </Link>
            ,{" "}
            <Link variant="homeEditorialLink" aria-label="Accès au site Parcoursup" href="https://www.parcoursup.fr" isExternal>
              parcoursup
            </Link>{" "}
            et bien d’autres.
          </Box>
        </Box>
        <Box order={{ base: "-1", md: "1" }}>
          <Image src="/images/home_pics/illu-plateformesjeunes.svg" alt="" />
        </Box>
      </SimpleGrid>
    </Box>
  )
}
export default OffresGratuites
