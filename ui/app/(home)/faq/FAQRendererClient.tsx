"use client"
import { Box, Container, Divider, Grid, GridItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { publicConfig } from "../../../config.public"
import { PAGES } from "../../../utils/routes.utils"
import Breadcrumb from "../../components/Breadcrumb"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

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

export default function FAQRendererClient({ recruteur, organisme, candidat }) {
  const pathname = usePathname()

  const [tabIndex, setTabIndex] = useState(0)

  const handleTabsChange = (index) => {
    setTabIndex(index)
  }

  useEffect(() => {
    const hash = pathname.split("#")[1]
    if (hash === "cfa") {
      setTabIndex(2)
    }
    if (hash === "recruteur") {
      setTabIndex(1)
    }
  }, [pathname])

  return (
    <Box>
      <Container variant="responsiveContainer" display="flex">
        <Breadcrumb pages={[PAGES.static.faq]} />
      </Container>

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
              <Tabs variant="unstyled" index={tabIndex} onChange={handleTabsChange}>
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
                    <NotionRenderer recordMap={candidat} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} bodyClassName="notion-body" />
                  </TabPanel>
                  <TabPanel height="auto" color="grey.800" padding="0 !important;">
                    <NotionRenderer recordMap={recruteur} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} bodyClassName="notion-body" />
                  </TabPanel>
                  <TabPanel height="auto" color="grey.800" padding="0 !important;">
                    <NotionRenderer recordMap={organisme} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} bodyClassName="notion-body" />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </GridItem>
        </Grid>
      </Container>
      <Box mb={3} />
    </Box>
  )
}
