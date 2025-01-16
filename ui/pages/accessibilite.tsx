import { Box, Container, Divider, SimpleGrid, Text } from "@chakra-ui/react"
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
  const recordMap = await fetchNotionPage("e1d22fdf90974d20af39d960d0b2901a")
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
        title="Déclaration d'accessibilité | La bonne alternance | Trouvez votre alternance"
        description="Politique de confidentialité, traitement des données à caractère personnel sur le site de La bonne alternance."
      />
      <ScrollToTop />
      <Navigation />
      <Box as="main">
        <Breadcrumb forPage="accessibilite" label="Déclaration d'accessibilité" />
        <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
          <SimpleGrid columns={[1, 1, 1, 2]}>
            <Box>
              <Box as="h1">
                <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                  Déclaration
                </Text>
                <Text as="span" display="block" mb={1} variant="editorialContentH1">
                  d'accessibilité
                </Text>
              </Box>
              <Divider variant="pageTitleDivider" my={12} />
            </Box>
            <NotionRenderer recordMap={recordMap} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} className="disable-chakra" />
          </SimpleGrid>
        </Container>
      </Box>
      <Footer />
    </Box>
  )
}

export default PolitiqueDeConfidentialite
