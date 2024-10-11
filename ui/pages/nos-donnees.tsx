import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Container, Divider, Grid, GridItem, Link, Text } from "@chakra-ui/react"
import { NextSeo } from "next-seo"
import React from "react"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

const Developpeurs = () => (
  <Box>
    <NextSeo
      title="Nos Données | La bonne alternance | Trouvez votre alternance"
      description="Afin de faciliter l’accès aux informations pour les publics là où ils se trouvent, nous avons développé 4 API et un Widget"
    />
    <ScrollToTop />
    <Navigation />
    <Box as="main">
      <Breadcrumb forPage="developpeurs" label="Développeurs" />
      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Grid templateColumns="repeat(12, 1fr)">
          <GridItem px={4} colSpan={[12, 12, 12, 5]}>
            <Text variant="editorialContentH1" as="h1">
              Nos Données
            </Text>
            <Divider variant="pageTitleDivider" my={12} />
          </GridItem>
          <GridItem px={4} colSpan={[12, 12, 12, 7]}>
            <Text as="p" mb={4}>
              Afin de faciliter l’accès aux données de l'apprentissage pour les publics là où ils se trouvent (notamment sur votre site internet !), nous avons développé 4 API et
              un Widget, disponibles en open source.
            </Text>

            <Divider mt={4} my={12} w="100%" />
            <Text as="p" mb={4}>
              Testez la dernière version (v2) de nos API et accédez à leur documentation sur la plateforme API Apprentissage :
            </Text>
            <Link
              variant="editorialContentLink"
              aria-label="Accès au site api.apprentissage - nouvelle fenêtre"
              href="https://api.apprentissage.beta.gouv.fr/fr/explorer"
              isExternal
            >
              https://api.apprentissage.beta.gouv.fr/fr/explorer <ExternalLinkIcon mx="2px" />
            </Link>

            <Divider mt={4} my={12} w="100%" />
            <Text as="p" mb={4}>
              Testez le widget et l'ancienne version (v1) de nos API et accédez à leur documentation sur le site API.gouv :
            </Text>
            <Link variant="editorialContentLink" aria-label="Accès au site api.gouv - nouvelle fenêtre" href="https://api.gouv.fr/les-api/api-la-bonne-alternance" isExternal>
              https://api.gouv.fr/les-api/api-la-bonne-alternance <ExternalLinkIcon mx="2px" />
            </Link>
          </GridItem>
        </Grid>
      </Container>
      <Box mb={3}>&nbsp;</Box>
    </Box>
    <Footer />
  </Box>
)

export default Developpeurs
