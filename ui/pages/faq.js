import React from "react"
import Navigation from "../components/navigation"
import Breadcrumb from "../components/breadcrumb"
import ScrollToTop from "../components/ScrollToTop"
import { NextSeo } from "next-seo"
import { NotionRenderer } from "react-notion-x"
import Footer from "../components/footer"
import { Box, Container, Divider, Grid, GridItem, Text } from "@chakra-ui/react"
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react"

import { fetchNotionPage } from "../services/fetchNotionPage"

export async function getStaticProps() {
  const [notionFAQrecruteur, notionFAQorganisme, notionFAQcandidat] = await Promise.all([
    await fetchNotionPage("95ae35012c6d4a32851b6c7b031fd28e"),
    await fetchNotionPage("b166d0ef1e6042f9a4bfd3a834f498d8"),
    await fetchNotionPage("2543e456b94649e5aefeefa64398b9f9"),
  ])

  return {
    props: {
      recruteur: notionFAQrecruteur,
      organisme: notionFAQorganisme,
      candidat: notionFAQcandidat,
    },
  }
}

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

const FAQ = ({ recruteur, organisme, candidat }) => {
  return (
    <Box>
      <NextSeo title="F.A.Q | La bonne alternance | Trouvez votre alternance" description="Questions fréquemment posées. Résultats entreprises, résultats formations, etc..." />

      <ScrollToTop />
      <Navigation bgcolor="is-white" />

      <Breadcrumb forPage="faq" label="FAQ" />

      <Container p={{ base: 2, md: 12 }} my={0} mb={[0, 12]} variant="pageContainer">
        <Grid templateColumns="repeat(12, 1fr)">
          <GridItem px={0} colSpan={[12, 12, 12, 5]}>
            <Box as="h1">
              <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                Questions
              </Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                fréquemment
              </Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                posées
              </Text>
            </Box>
            <Divider variant="pageTitleDivider" my={12} />
          </GridItem>
          <GridItem px={0} colSpan={[12, 12, 12, 7]}>
            <Box>
              <Tabs variant="unstyled">
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
                    <NotionRenderer
                      recordMap={candidat}
                      fullPage={false}
                      darkMode={false}
                      disableHeader={true}
                      rootDomain={process.env.NEXT_PUBLIC_BASE_URL}
                      bodyClassName="notion-body"
                    />
                  </TabPanel>
                  <TabPanel height="auto" color="grey.800" padding="0 !important;">
                    <NotionRenderer
                      recordMap={recruteur}
                      fullPage={false}
                      darkMode={false}
                      disableHeader={true}
                      rootDomain={process.env.NEXT_PUBLIC_BASE_URL}
                      bodyClassName="notion-body"
                    />
                  </TabPanel>
                  <TabPanel height="auto" color="grey.800" padding="0 !important;">
                    <NotionRenderer
                      recordMap={organisme}
                      fullPage={false}
                      darkMode={false}
                      disableHeader={true}
                      rootDomain={process.env.NEXT_PUBLIC_BASE_URL}
                      bodyClassName="notion-body"
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </GridItem>
        </Grid>
      </Container>
      <Box mb={3}>&nbsp;</Box>
      <Footer />
    </Box>
  )
}

export default FAQ
