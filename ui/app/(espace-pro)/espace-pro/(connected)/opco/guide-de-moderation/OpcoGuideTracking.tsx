"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"
import { getOpcoGuideLandingSection } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
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

// Une lecture par affichage de la page : pause et reprise ne recomptent pas.
export const createVideoPlayTracker = () => {
  let tracked = false
  return () => {
    if (tracked) return
    tracked = true
    pushMatomoEvent({ event: MATOMO_EVENTS.OPCO_GUIDE_VIDEO_PLAYED })
  }
}

export function OpcoGuideVideo({ src, caption }: { src: string; caption: ReactNode }) {
  const captionId = useId()
  const [onPlay] = useState(createVideoPlayTracker)
  return (
    <figure className={fr.cx("fr-mb-6v")}>
      <video
        controls
        preload="metadata"
        playsInline
        src={src}
        aria-describedby={captionId}
        onPlay={onPlay}
        style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: "#000" }}
      >
        Votre navigateur ne permet pas de lire cette vidéo.
      </video>
      <figcaption id={captionId} className={fr.cx("fr-mt-2v", "fr-text--sm")}>
        {caption}{" "}
        <DsfrLink href={src} external prefetch={false} size="sm">
          Ouvrir la vidéo dans un nouvel onglet
        </DsfrLink>
      </figcaption>
    </figure>
  )
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
