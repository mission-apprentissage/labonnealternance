import type { Metadata } from "next"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { METADATA } from "@/utils/routes.metadata.utils"
import { DesinscriptionRecruteur } from "./Desinscription"
export const metadata: Metadata = {
  title: METADATA.static.desinscription().title,
  description: METADATA.static.desinscription().description,
}

export default function PageDesinscription() {
  return (
    <DepotSimplifieStyling>
      <DesinscriptionRecruteur />
    </DepotSimplifieStyling>
  )
}
