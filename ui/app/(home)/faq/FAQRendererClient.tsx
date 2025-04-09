"use client"
import { Box, Container, Divider, Grid, GridItem, Text } from "@chakra-ui/react"
import { Tabs } from "@codegouvfr/react-dsfr/Tabs"
import dynamic from "next/dynamic"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { useUrlHash } from "@/app/hooks/useUrlHash"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

export default function FAQRendererClient({ recruteur, organisme, candidat }) {
  const tabs = [
    { tabId: "candidat", label: "Candidat", recordMap: candidat },
    { tabId: "recruteur", label: "Recruteur", recordMap: recruteur },
    { tabId: "cfa", label: "Organisme de formation", recordMap: organisme },
  ]
  const [firstTab] = tabs

  const { hash } = useUrlHash()

  const selectedTabId = hash || firstTab.tabId
  const displayedTab = tabs.find((x) => x.tabId === selectedTabId) ?? firstTab

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.faq]} />
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
            <Tabs
              selectedTabId={selectedTabId}
              tabs={tabs}
              onTabChange={(tabId) => {
                window.location.hash = tabId
              }}
            >
              <Box height="auto" color="grey.800" padding="0 !important;">
                <NotionRenderer
                  recordMap={displayedTab.recordMap}
                  fullPage={false}
                  darkMode={false}
                  disableHeader={true}
                  rootDomain={publicConfig.baseUrl}
                  bodyClassName="notion-body"
                />
              </Box>
            </Tabs>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  )
}
