import { Box, Container, Divider, Grid, GridItem, Text } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { NextSeo } from "next-seo"
import React from "react"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"
import { publicConfig } from "../config.public"
import { fetchNotionPage } from "../services/fetchNotionPage"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

export async function getStaticProps() {
  const recordMap = await fetchNotionPage("3086c10e9c074efdaa895c089961fcd0")

  return {
    props: {
      recordMap,
    },
  }
}

const CGU = ({ recordMap }) => {
  return (
    <Box>
      <NextSeo
        title="Conditions générales d'utilisation | La bonne alternance | Trouvez votre alternance"
        description="Conditions générales d’utilisation de La bonne alternance."
      />

      <ScrollToTop />
      <Navigation />

      <Box as="main">
        <Breadcrumb forPage="cgu" label="CGU" />
        <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
          <Grid templateColumns="repeat(12, 1fr)">
            <GridItem px={4} colSpan={[12, 12, 12, 5]}>
              <Box as="h1">
                <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                  Conditions
                </Text>
                <Text as="span" display="block" mb={1} variant="editorialContentH1">
                  générales
                </Text>
                <Text as="span" display="block" mb={1} variant="editorialContentH1">
                  d&apos;utilisation
                </Text>
              </Box>
              <Divider variant="pageTitleDivider" my={12} />
            </GridItem>
            <GridItem px={4} colSpan={[12, 12, 12, 7]}>
              <Box>
                <NotionRenderer recordMap={recordMap} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} bodyClassName="notion-body" />
              </Box>
            </GridItem>
          </Grid>
        </Container>
        <Box mb={3}>&nbsp;</Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default CGU
