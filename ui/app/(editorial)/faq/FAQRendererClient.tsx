"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Tabs } from "@codegouvfr/react-dsfr/Tabs"
import { Box, Grid2 as Grid, Typography } from "@mui/material"
import dynamic from "next/dynamic"
import { ExtendedRecordMap } from "notion-types"
import { useEffect, useRef, useState } from "react"
import { assertUnreachable } from "shared"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { useUrlHash } from "@/app/hooks/useUrlHash"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

function clickAndscrollToElement(page: HTMLElement, querySelector: string): boolean {
  const childElement = page.querySelector(querySelector)
  if (!childElement) {
    return false
  }
  const typedChildElement = childElement as HTMLElement
  typedChildElement.click()
  const htmlElement = document.body.parentElement
  htmlElement.scrollTo({ top: typedChildElement.getBoundingClientRect().top })
  return true
}

type OnLoadedDescriptor = {
  action: "clickAndScroll"
  selector: string
}

function onLoadedDescriptorToFct(descriptor?: OnLoadedDescriptor) {
  if (!descriptor) return undefined
  switch (descriptor.action) {
    case "clickAndScroll":
      return (page) => clickAndscrollToElement(page, descriptor.selector)
    default:
      assertUnreachable(descriptor.action)
  }
}

export default function FAQRendererClient({
  onLoaded,
  ...rest
}: {
  recruteur: ExtendedRecordMap
  organisme: ExtendedRecordMap
  candidat: ExtendedRecordMap
  onLoaded?: OnLoadedDescriptor
}) {
  return <FAQRendererClientGeneric {...rest} onLoaded={onLoadedDescriptorToFct(onLoaded)} />
}

function FAQRendererClientGeneric({
  recruteur,
  organisme,
  candidat,
  onLoaded,
}: {
  recruteur: ExtendedRecordMap
  organisme: ExtendedRecordMap
  candidat: ExtendedRecordMap
  onLoaded?: (page: HTMLElement) => boolean
}) {
  const pageRef = useRef<HTMLElement>(null)
  const [hasExecutedOnLoaded, setExecutedOnLoaded] = useState<boolean>(false)
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasExecutedOnLoaded || !onLoaded) {
        clearInterval(interval)
        return
      }

      const pageElement = pageRef.current
      if (!pageElement) {
        return
      }
      const hasExecuted = onLoaded?.(pageElement)
      if (hasExecuted) {
        setExecutedOnLoaded(true)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [hasExecutedOnLoaded, onLoaded])

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
    <Box ref={pageRef}>
      <Breadcrumb pages={[PAGES.static.faq]} />
      <DefaultContainer>
        <Box sx={{ p: fr.spacing("5w"), marginBottom: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={fr.spacing("5w")}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ mb: 2 }}>
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
