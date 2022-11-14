import React from "react";
import { Box, Button, Flex, Image, SimpleGrid, Text, Container, Grid, GridItem, Divider} from '@chakra-ui/react'

import ConnectionActions from "./ConnectionActions";
import votrebesoinImage from '../../public/images/home_pics/illu-votrebesoin.svg'
import ujusImage from '../../public/images/home_pics/1j1s.svg'
import parcoursupImage from '../../public/images/home_pics/parcoursup.svg'

const Entreprise = () => {
  return (
    <Box as="section" p={3} mb={{ base: '2', md: '5' }} >
      <div className="row">
        <div className="col-12 col-md-6 d-none d-md-block">
          <Image src={votrebesoinImage} alt="Votre besoin" />
          <Image src={ujusImage} alt="1 jeune 1 solution" />
          <Image src={parcoursupImage} alt="parcoursup" />
        </div>
        <div className="col-12 col-md-6 order-md-first">
          <h1 className="c-homecomponent-title c-homecomponent-title__blue mb-3">Vous êtes une entreprise</h1>
          <h2 className="c-homecomponent-title__small mb-3 mb-lg-5">
            Diffusez simplement et gratuitement vos offres en alternance.
          </h2>
          <div>
            Exprimez vos besoins en alternance afin d’être visible auprès des jeunes en recherche de contrat, et des
            centres de formation pouvant vous accompagner.
          </div>
          <ConnectionActions service="entreprise" />
        </div>
      </div>
    </Box>
  );
};

export default Entreprise;
