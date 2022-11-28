import React from "react"
import Breadcrumb from "../components/breadcrumb"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

import Footer from "../components/footer"
import { Box, Grid, GridItem, Text, Container, Divider, Link } from "@chakra-ui/react"

const stats = () => (
  <Box>
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="stats" label="Statistiques" />

    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Grid templateColumns="repeat(12, 1fr)">
        <GridItem px={4} colSpan={[12, 12, 12, 5]}>
          <Box as="h1">
            <Text as="span" display="block" mb={1} variant="editorialContentH1">
              Statistiques
            </Text>
          </Box>
          <Divider variant="pageTitleDivider" my={12} />
        </GridItem>
        <GridItem px={4} colSpan={[12, 12, 12, 7]}>
          <Text as="h2" mb="2" variant="homeEditorialH2">
            Statistiques
          </Text>
          <Text as="p" mb="3">
            La bonne alternance est une startup d’Etat incubée par beta.gouv. Nous développons un service à destination des publics selon les principes du{" "}
            <Link href="https://beta.gouv.fr/approche/manifeste" aria-label="Accès au site de Beta gouv" isExternal variant="editorialContentLink">
              Manifeste de beta.gouv
            </Link>
          </Text>
          <Text as="p" mb="3">
            Nous mesurons l’impact de nos actions et publions en toute transparence nos statistiques que vous pouvez{" "}
            <Link
              href="https://datastudio.google.com/reporting/1v-Sim2qMlFSMn4n9JJWaMk8PIONvM757"
              aria-label="Accès aux statistiques du service"
              isExternal
              variant="editorialContentLink"
            >
              consulter ici
            </Link>
          </Text>
        </GridItem>
      </Grid>
    </Container>

    <Footer />
  </Box>
)

export default stats
