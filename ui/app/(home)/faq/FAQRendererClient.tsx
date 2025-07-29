"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Tabs } from "@codegouvfr/react-dsfr/Tabs"
import { Box, Grid2 as Grid, Typography } from "@mui/material"
import dynamic from "next/dynamic"
import { ExtendedRecordMap } from "notion-types"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { useUrlHash } from "@/app/hooks/useUrlHash"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

interface Props {
  recruteur: ExtendedRecordMap
  organisme: ExtendedRecordMap
  candidat: ExtendedRecordMap
}

export default function FAQRendererClient({ recruteur, organisme, candidat }: Props) {
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
      <DefaultContainer>
        <Box sx={{ p: fr.spacing("5w"), marginBottom: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={fr.spacing("5w")}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography component={"h1"} variant="h1" sx={{ mb: 2 }}>
                Questions
                <br />
                <Typography component={"h1"} variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
                  fréquemment
                  <br />
                </Typography>
                <Typography component={"h1"} variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
                  posées
                </Typography>{" "}
              </Typography>
              <Box
                component="hr"
                sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
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
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
