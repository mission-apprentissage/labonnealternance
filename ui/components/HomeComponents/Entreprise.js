import React from "react"
import { Box, Image, SimpleGrid, Text, Show } from "@chakra-ui/react"

import ConnectionActions from "./ConnectionActions"
import votrebesoinImage from "../../public/images/home_pics/illu-votrebesoin.svg"

const Entreprise = () => {
  return (
    <Box as="section" p={3} mb={{ base: "2", md: "0" }} backgroundColor="white">
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px" mb={12}>
        <Box>
          <Text as="h1" variant="homeEditorialH1" mb={3}>
            Vous êtes une entreprise
          </Text>
          <Text as="h2" variant="homeEditorialH2" mb={{ base: "3", lg: "5" }}>
            Diffusez simplement et gratuitement vos offres en alternance
          </Text>
          <Box fontWeight={"500"}>
            Exprimez vos besoins en alternance afin d’être visible auprès des jeunes en recherche de contrat, et des centres de formation pouvant vous accompagner.
          </Box>
          <ConnectionActions service="entreprise" />
        </Box>
        <Show above="md">
          <Box>
            <Image src={votrebesoinImage} alt="" />
          </Box>
        </Show>
      </SimpleGrid>
    </Box>
  )
}

export default Entreprise
