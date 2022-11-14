import React from "react";
import { Box, Text, SimpleGrid, Image } from "@chakra-ui/react"
import solliciterCFAImage from "../../public/images/home_pics/illu-solliciterCFA.svg"

const OrganismesMandataires = () => {
  return (
    <Box as="section" p={3} mb={{ base: '2', md: '5' }} >
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing='40px' alignItems={"center"} mt={12}>
        <Box>
          <Image src={solliciterCFAImage} alt="Solliciter CFA" />
        </Box>
        <Box pl={{ base: 5 }}>
          <Text as="h2" variant="pageEntrepriseH2" mb={{ base: '3', lg: '5' }}>
            Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
          </Text>
          <Box variant="pageEntrepriseText">
            Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin
            d’accélérer vos recrutements.
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default OrganismesMandataires;
