import React from "react";
import Navigation from "../components/navigation";
import ScrollToTop from "../components/ScrollToTop";
import Breadcrumb from "../components/breadcrumb";
import { NextSeo } from "next-seo";

import Footer from "../components/footer";
import ExternalLink from "../components/externalLink";

import { Box, Grid, GridItem, Text } from '@chakra-ui/react';

const developpeurs = () => (
  <div>
    <NextSeo
      title="Développeurs | La Bonne Alternance | Trouvez votre alternance"
      description="Afin de faciliter l’accès aux informations pour les publics là où ils se trouvent, nous avons développé 4 API et un Widget"
    />
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="developpeurs" label="Développeurs" />

    <Box p={12} my={0} mb={[0,12]} className="c-page-container container">
      <Grid templateColumns="repeat(12, 1fr)">
        <GridItem px={4} colSpan={[12,12,12,5]}>
          <Text variant="editorialContentH1" as="h1">Développeurs</Text>
          <hr className="c-page-title-separator" align="left" />
        </GridItem>
        <GridItem px={4} colSpan={[12,12,12,7]}>
          <Text variant="editorialContentH3" as="h3">Code source ouvert</Text>
          <ExternalLink
            url="https://github.com/mission-apprentissage/labonnealternance"
            title="LBA - Recherche d'une formation et/ou d'un organisme de formation en apprentissage"
          />
          <h3 className="mt-3">Données ouvertes</h3>
          <p>
            Afin de faciliter l’accès aux informations pour les publics là où ils se trouvent (notamment sur votre site
            internet !), nous avons développé 4 API et un Widget, disponibles en open source.
          </p>
          <p>Testez le widget et les API et accédez à leur documentation sur le site API.gouv</p>
          <ExternalLink
            url="https://api.gouv.fr/les-api/api-la-bonne-alternance"
            title="https://api.gouv.fr/les-api/api-la-bonne-alternance"
          />
        </GridItem>
      </Grid>
    </Box>
    <Box mb={3}>&nbsp;</Box>
    <Footer />
  </div>
);

export default developpeurs;
