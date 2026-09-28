"use client"

import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { footerId, headerId, mainId, type ZoneName } from "@/app/_components/zone-ids"
import { useIsWidget } from "@/app/hooks/use-is-widget"

/**
 * Ossature des pages de détail (offre, formation). Elle vit dans un layout au niveau du segment
 * `emploi` / `formation`, et non dans la page : une page portant un identifiant de route dynamique
 * est conservée montée par route consultée (`createRouterCacheKey` clé un segment dynamique par sa
 * valeur), si bien que deux offres visitées à la suite dupliqueraient en-tête, pied de page et
 * ancres d'évitement. Le layout, lui, n'existe qu'en un exemplaire pour tout le segment.
 *
 * En mode widget (page embarquée en iframe) la navigation LBA n'a pas lieu d'être : ni en-tête, ni
 * pied de page, et les liens d'évitement correspondants disparaissent avec eux plutôt que de viser
 * une ancre inexistante.
 */
export function DetailZoneLayout({ zone, children }: PropsWithChildren<{ zone: ZoneName }>) {
  const isWidget = useIsWidget()

  return (
    <>
      <SkipLinks
        links={[
          ...(isWidget ? [] : [{ label: "Menu", anchor: `#${headerId(zone)}` }]),
          { label: "Contenu", anchor: `#${mainId(zone)}` },
          ...(isWidget ? [] : [{ label: "Pied de page", anchor: `#${footerId(zone)}` }]),
        ]}
      />
      {!isWidget && <PublicHeaderStatic zone={zone} />}
      <Box component="main" role="main" id={mainId(zone)} tabIndex={-1}>
        {children}
      </Box>
      {!isWidget && <Footer zone={zone} />}
    </>
  )
}
