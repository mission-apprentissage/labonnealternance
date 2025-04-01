"use client"

import { Box, Container, Grid, GridItem, Text } from "@chakra-ui/react"
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu"
import Tabs from "@codegouvfr/react-dsfr/Tabs"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { useUrlHash } from "@/app/hooks/useUrlHash"
import RessourcesCandidat from "@/components/Ressources/ressourcesCandidat"
import RessourcesCFA from "@/components/Ressources/ressourcesCFA"
import RessourcesRecruteur from "@/components/Ressources/ressourcesRecruteur"

import { PAGES } from "../../../utils/routes.utils"
import { Breadcrumb } from "../../_components/Breadcrumb"

export default function Ressources() {
  const tabs = [
    { tabId: "candidat", label: "Candidats", content: <RessourcesCandidat /> },
    { tabId: "recruteur", label: "Recruteurs", content: <RessourcesRecruteur /> },
    { tabId: "cfa", label: "Organismes de formation", content: <RessourcesCFA /> },
  ]
  const [firstTab] = tabs

  const { hash, isClient } = useUrlHash()
  if (!isClient) return <LoadingEmptySpace />
  const selectedTabId = hash || firstTab.tabId
  const displayedTab = tabs.find((x) => x.tabId === selectedTabId) ?? firstTab

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.ressources]} />

      <Container p={{ base: 2, md: 0 }} my={0} mb={[0, 12]} variant="whitePageContainer">
        <Box as="h1" mb={8}>
          <Text as="span" display="block" mb={1} variant="editorialContentH1">
            Ressources
          </Text>
        </Box>
        <Grid templateColumns="repeat(5, 1fr)" gap={10}>
          <GridItem display={{ base: "none", lg: "block" }} colSpan={{ base: 0, lg: 1 }}>
            <SideMenu
              align="left"
              burgerMenuButtonText="Dans cette rubrique"
              items={tabs.map(({ tabId, label }) => ({
                isActive: selectedTabId === tabId,
                linkProps: {
                  href: "#" + tabId,
                },
                text: label,
              }))}
            />
          </GridItem>
          <GridItem colSpan={{ base: 5, lg: 4 }}>
            <Box display={{ base: "block", lg: "none" }} mb={6}>
              <Tabs
                selectedTabId={selectedTabId}
                tabs={tabs.map(({ label, tabId }) => ({ label, tabId }))}
                onTabChange={(tabId) => {
                  window.location.hash = tabId
                }}
              >
                <></>
              </Tabs>
            </Box>
            {displayedTab.content}
          </GridItem>
        </Grid>
      </Container>
    </Box>
  )
}
