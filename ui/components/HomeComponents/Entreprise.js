import React from "react";
import { Box, Image, SimpleGrid, Text, Show} from '@chakra-ui/react'

import ConnectionActions from "./ConnectionActions";
import votrebesoinImage from '../../public/images/home_pics/illu-votrebesoin.svg'
import ujusImage from '../../public/images/home_pics/1j1s.svg'
import parcoursupImage from '../../public/images/home_pics/parcoursup.svg'

const Entreprise = () => {
  return (
    <Box as="section" p={3} mb={{ base: '2', md: '5' }} >
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing='40px'>
        <Box>
          <Text as="h1" fontSize={{ base: '24px', md: '32px' }} color={"#000091"} lineHeight={"40px"} fontWeight={"700"}>Vous êtes une entreprise</Text>
          <Text as="h2" fontSize={{ base: '22px', md: '28px' }} color={"#3a3a3a"} mb={{ base: '3', lg: '5' }}>Diffusez simplement et gratuitement vos offres en alternance.</Text>
          <Box>
            Exprimez vos besoins en alternance afin d’être visible auprès des jeunes en recherche de contrat, et des
            centres de formation pouvant vous accompagner.
          </Box>
          <ConnectionActions service="entreprise" />
        </Box>
        <Show above="md">
          <Box position={"relative"}>
            <Image src={votrebesoinImage} alt="Votre besoin" />
            <Image src={ujusImage} alt="1 jeune 1 solution" />
            <Image src={parcoursupImage} alt="parcoursup" />
          </Box>
        </Show>
      </SimpleGrid>
    </Box>
  );
};

export default Entreprise;
