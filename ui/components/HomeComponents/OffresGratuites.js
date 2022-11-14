import React from "react";
import ExternalLink from "../externalLink";
import { Box, Text } from '@chakra-ui/react'

const OffresGratuites = () => {
  return (
    <Box as="section" p={3} mb={{ base: '2', md: '5' }} >
      <div className="row">
        <div className="col-12 col-md-6">
          <img
            className="c-homecomponent-illustration mr-3 my-3"
            src="/images/home_pics/illu-plateformesjeunes.svg"
            alt=""
          />
        </div>
        <div className="col-12 col-md-6 pt-md-5 order-md-first">
          <Text as="h2" variant="pageEntrepriseH2" mb={{ base: '3', lg: '5' }}>Vos offres sont diffusées gratuitement au plus près des candidats.</Text>
          <Box variant="pageEntrepriseText">
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
        </div>
      </div>
    </Box>
  );
};
export default OffresGratuites;
