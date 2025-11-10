"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"
import dynamic from "next/dynamic"
import type { ExtendedRecordMap } from "notion-types"
import { useEffect, useRef, useState } from "react"
import { assertUnreachable } from "shared"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { useUrlHash } from "@/app/hooks/useUrlHash"
import { publicConfig } from "@/config.public"
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(async () => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

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
    <Box ref={pageRef} mb={fr.spacing("3w")}>
      <Breadcrumb pages={[PAGES.static.faq]} />
      <DefaultContainer>
        <Box mb={fr.spacing("1w")}>
          <Typography id="editorial-content-container" component={"h1"} variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default }}>
            Questions fréquement posées
          </Typography>
        </Box>
        <Grid container>
          <Grid size={{ xs: 12, md: 3 }}>
            <nav className="fr-sidemenu fr-mt-4w" aria-labelledby="fr-sidemenu-title">
              <div className="fr-sidemenu__inner">
                <button className="fr-sidemenu__btn" aria-controls="fr-sidemenu-wrapper" aria-expanded="false">
                  Dans cette rubrique
                </button>
                <div className="fr-collapse" id="fr-sidemenu-wrapper">
                  <ul className="fr-sidemenu__list">
                    {tabs.map(({ tabId, label }) => (
                      <li key={tabId} className={`fr-sidemenu__item ${selectedTabId === tabId ? "fr-sidemenu__item--active" : ""}`}>
                        <a className="fr-sidemenu__link" href={`#${tabId}`} target="_self" aria-current={selectedTabId === tabId ? "page" : undefined}>
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </nav>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <NotionRenderer recordMap={displayedTab.recordMap} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} />
          </Grid>
        </Grid>
      </DefaultContainer>
    </Box>
  )
}
