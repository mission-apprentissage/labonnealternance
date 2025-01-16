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
  const recordMap = await fetchNotionPage("edb34310adc744b4b2001c34f162ee5a")

  return {
    props: {
      recordMap,
    },
  }
}

const MentionsLegales = ({ recordMap }) => {
  return (
    <Box>
      <NextSeo title="Mentions Légales | La bonne alternance | Trouvez votre alternance" description="Mentions légales du site." />
      <ScrollToTop />
      <Navigation />
      <Breadcrumb forPage="mentions-legales" label="Mentions légales" />

      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Grid templateColumns="repeat(12, 1fr)">
          <GridItem px={4} colSpan={[12, 12, 12, 5]}>
            <Box as="h1">
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                Mentions légales
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

      <Footer />
    </Box>
  )
}

export default MentionsLegales
