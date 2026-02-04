import type { Metadata } from "next"
import CfaHome from "@/app/(espace-pro)/espace-pro/(connected)/_components/CfaHome"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.backCfaHome.getMetadata().title,
}

export default function CfaPage() {
  return (
    <DepotSimplifieStyling>
      <CfaHome />
    </DepotSimplifieStyling>
  )
}
