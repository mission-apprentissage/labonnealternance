import React from "react";
import { Box, Text } from '@chakra-ui/react'

const OrganismesMandataires = () => {
  return (
    <Box as="section" p={3} mb={{ base: '2', md: '5' }} >
      <div className="row">
        <div className="col-12 col-md-6">
          <img
            className="c-homecomponent-illustration mr-3 my-3"
            src="/images/home_pics/illu-solliciterCFA.svg"
            alt=""
          />
        </div>
        <div className="col-12 col-md-6 pt-md-5">
          <Text as="h2" variant="pageEntrepriseH2" mb={{ base: '3', lg: '5' }}>
            Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
          </Text>
          <Box variant="pageEntrepriseText">
            Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin
            d’accélérer vos recrutements.
          </Box>
        </div>
      </div>
    </Box>
  );
};

export default OrganismesMandataires;
