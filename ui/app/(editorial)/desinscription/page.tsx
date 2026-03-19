import type { Metadata } from "next"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { PAGES } from "@/utils/routes.utils"
import { DesinscriptionRecruteur } from "./Desinscription"

export const metadata: Metadata = {
  title: PAGES.static.desinscription.getMetadata().title,
  description: PAGES.static.desinscription.getMetadata().description,
}

export default function PageDesinscription() {
  return (
    <DepotSimplifieStyling>
      <DesinscriptionRecruteur />
    </DepotSimplifieStyling>
  )
}
