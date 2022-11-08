import React from "react";
import Navigation from "../components/navigation";
import ScrollToTop from "../components/ScrollToTop";
import Breadcrumb from "../components/breadcrumb";
import { NextSeo } from "next-seo";

import Footer from "../components/footer";
import ExternalLink from "../components/externalLink";

import { Box, Grid, GridItem, Text, Link } from '@chakra-ui/react';

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
          <Link variant="editorialContentLink" href="https://github.com/mission-apprentissage/labonnealternance" isExternal>
            LBA - Recherche d&apos;une formation et/ou d&apos;un organisme de formation en apprentissage
          </Link>
          <Text variant="editorialContentH3" as="h3" mt={4}>Données ouvertes</Text>
          <Text as="p" mb={4}>
            Afin de faciliter l’accès aux informations pour les publics là où ils se trouvent (notamment sur votre site
            internet !), nous avons développé 4 API et un Widget, disponibles en open source.
          </Text>
          <Text as="p" mb={4}>Testez le widget et les API et accédez à leur documentation sur le site API.gouv</Text>
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
