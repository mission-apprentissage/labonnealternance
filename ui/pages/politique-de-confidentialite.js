import { NextSeo } from "next-seo"
import React from "react"
import Breadcrumb from "../components/breadcrumb"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"
import { NotionRenderer } from "react-notion-x"

import Footer from "../components/footer"

import { Box, Container, Divider, Grid, GridItem, Text } from "@chakra-ui/react"

import { fetchNotionPage } from "../services/fetchNotionPage"

export async function getStaticProps() {
  const recordMap = await fetchNotionPage("2d7d9cda6d9a4059baa84eacff592139")

  return {
    props: {
      recordMap,
    },
  }
}

const PolitiqueDeConfidentialite = ({ recordMap }) => {
  return (
    <Box>
      <NextSeo
        title="Politique de confidentialité | La bonne alternance | Trouvez votre alternance"
        description="Politique de confidentialité, traitement des données à caractère personnel sur le site de La bonne alternance."
      />

      <ScrollToTop />
      <Navigation />
      <Breadcrumb forPage="politique-de-confidentialite" label="Politique de confidentialité" />

      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Grid templateColumns="repeat(12, 1fr)">
          <GridItem px={4} colSpan={[12, 12, 12, 5]}>
            <Box as="h1">
              <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                Politique
              </Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                de confidentialité
              </Text>
            </Box>
            <Divider variant="pageTitleDivider" my={12} />
          </GridItem>
          <GridItem px={4} colSpan={[12, 12, 12, 7]}>
            <Box>
              <NotionRenderer
                recordMap={recordMap}
                fullPage={false}
                darkMode={false}
                disableHeader={true}
                rootDomain={process.env.REACT_APP_BASE_URL}
                bodyClassName="notion-body"
              />
            </Box>
          </GridItem>
        </Grid>
      </Container>
      <Footer />
    </Box>
  )
}

export default PolitiqueDeConfidentialite
