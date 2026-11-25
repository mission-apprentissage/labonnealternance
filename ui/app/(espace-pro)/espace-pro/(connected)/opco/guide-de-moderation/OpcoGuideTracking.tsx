"use client"

import Button from "@codegouvfr/react-dsfr/Button"
import { useEffect, useRef } from "react"
import { getOpcoGuideLandingSection } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"
import { PAGES } from "@/utils/routes.utils"

export function OpcoGuideDisplayedTracking() {
  const trackedRef = useRef(false)
  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    pushMatomoEvent({ event: MATOMO_EVENTS.OPCO_GUIDE_DISPLAYED, opco_guide_section: getOpcoGuideLandingSection(window.location.hash) })
  }, [])
  return null
}

export function OpcoGuideCtaButton() {
  return (
    <Button
      iconId="fr-icon-arrow-right-line"
      iconPosition="right"
      linkProps={{ href: PAGES.static.backOpcoHome.getPath(), onClick: () => pushMatomoEvent({ event: MATOMO_EVENTS.OPCO_GUIDE_CTA_CLICKED }) }}
    >
      Vérifier les comptes en attente
    </Button>
  )
}
