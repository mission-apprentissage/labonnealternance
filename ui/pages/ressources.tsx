import { Box, Container, Divider, Grid, GridItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react"
import { NextSeo } from "next-seo"
import React from "react"

import RessourcesCandidat from "@/components/Ressources/resssourcesCandidat"
import RessourcesCFA from "@/components/Ressources/resssourcesCFA"
import RessourcesRecruteur from "@/components/Ressources/resssourcesRecruteur"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

const selectedTabParams = {
  color: "#1d1d1d",
  background: "white",
  borderBottom: "none",
  borderTop: "1px solid",
  borderTopColor: "#ddd",
  borderLeft: "1px solid",
  borderRight: "1px solid",
  borderRightColor: "#ddd",
  borderLeftColor: "#ddd",
}

const tabParams = {
  color: "bluefrance.500",
  background: "grey.100",
  marginRight: 2,
  p: { base: 1, sm: 4 },
}

// écrase l'effet de focus trop massif de chakra
const focusedTabParams = {}

const Ressources = () => {
  return (
    <Box>
      <NextSeo title="Ressources | La bonne alternance | Trouvez votre alternance" description="Ressources alternance..." />

      <ScrollToTop />
      <Navigation />

      <Breadcrumb forPage="ressources" label="Ressources" />

      <Container p={{ base: 2, md: 0 }} my={0} mb={[0, 12]} variant="whitePageContainer">
        <Box as="h1" mb={8}>
          <Text as="span" display="block" mb={1} variant="editorialContentH1">
            Ressources partir sur du controlled pour avoir les tabs puis intégrer les maquettes
          </Text>
        </Box>
        <Box>
          <Tabs orientation="vertical" variant="unstyled">
            <TabList px={0}>
              <Tab {...tabParams} _focus={focusedTabParams} _selected={selectedTabParams}>
                Candidat
              </Tab>
              <Tab {...tabParams} _focus={focusedTabParams} _selected={selectedTabParams}>
                Recruteur
              </Tab>
              <Tab {...tabParams} _focus={focusedTabParams} _selected={selectedTabParams}>
                Organisme de formation
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel height="auto" color="grey.800" padding="0 !important;">
                <RessourcesCandidat />
              </TabPanel>
              <TabPanel height="auto" color="grey.800" padding="0 !important;">
                <RessourcesRecruteur />
              </TabPanel>
              <TabPanel height="auto" color="grey.800" padding="0 !important;">
                <RessourcesCFA />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
      <Box mb={3}>&nbsp;</Box>
      <Footer />
    </Box>
  )
}

export default Ressources
