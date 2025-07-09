"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu"
import Tabs from "@codegouvfr/react-dsfr/Tabs"
import { Box, Typography } from "@mui/material"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
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

      <DefaultContainer>
        <Box mb={fr.spacing("3w")}>
          <Typography component={"h1"} variant="h1" sx={{ color: "#0063BC" }}>
            Ressources
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(1, 1fr)",
              lg: "repeat(5, 1fr)",
            },
          }}
        >
          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              gridColumn: { lg: "span 1" },
            }}
          >
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
          </Box>

          <Box
            sx={{
              gridColumn: { xs: "span 1", lg: "span 4" },
            }}
          >
            <Box sx={{ display: { xs: "block", lg: "none" }, mb: 6 }}>
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
          </Box>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
