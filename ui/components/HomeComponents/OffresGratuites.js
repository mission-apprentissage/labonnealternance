import React from "react"
import plateformesjeunesImage from "../../public/images/home_pics/illu-plateformesjeunes.svg"

import { Box, Image, Link, SimpleGrid, Text } from "@chakra-ui/react"

const OffresGratuites = () => {
  return (
    <Box as="section" p={3} mb={{ base: "2", md: "5" }}>
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px" alignItems={"center"} mt={12}>
        <Box pl={{ base: 5 }}>
          <Text as="h2" variant="homeEditorialH2" mb={{ base: "3", lg: "5" }}>
            Vos offres sont diffusées gratuitement au plus près des candidats.
          </Text>
          <Box variant="homeEditorialText">
            Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
            <Link variant="homeEditorialLink" aria-label="Redirection vers la page d'accueil" href="https://labonnealternance.pole-emploi.fr" isExternal>
              la Bonne Alternance
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
          <Image src={plateformesjeunesImage} alt="Plateforme jeune" />
        </Box>
      </SimpleGrid>
    </Box>
  )
}
export default OffresGratuites
