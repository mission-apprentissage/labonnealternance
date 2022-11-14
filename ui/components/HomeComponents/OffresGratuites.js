import React from "react";
import ExternalLink from "../externalLink";
import plateformesjeunesImage from '../../public/images/home_pics/illu-plateformesjeunes.svg'

import { Box, Text, SimpleGrid, Image } from '@chakra-ui/react'

const OffresGratuites = () => {
  return (
    <Box as="section" p={3} mb={{ base: '2', md: '5' }} >
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing='40px' alignItems={"center"} mt={12}>
        <Box pl={{base: 5}}>
          <Text as="h2" variant="homeEditorialH2" mb={{ base: '3', lg: '5' }}>Vos offres sont diffusées gratuitement au plus près des candidats.</Text>
          <Box variant="homeEditorialText">
            Elles sont mises en ligne sur les sites les plus visités par les candidats en recherche d’alternance :{" "}
            <ExternalLink
              className="c-homecomponent-link__inline"
              url="https://labonnealternance.pole-emploi.fr"
              title="La bonne alternance"
            />
            ,{" "}
            <ExternalLink
              className="c-homecomponent-link__inline"
              url="https://www.1jeune1solution.gouv.fr"
              title="1jeune1solution"
            />
            ,{" "}
            <ExternalLink className="c-homecomponent-link__inline" url="https://www.parcoursup.fr" title="Parcoursup" />{" "}
            et bien d’autres.
          </Box>
        </Box>
        <Box order={{base: '-1', md: '1'}}>
          <Image src={plateformesjeunesImage} alt="Plateforme jeune" />
        </Box>
      </SimpleGrid>
    </Box>
  );
};
export default OffresGratuites;
