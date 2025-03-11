"use client"

import { DepotRapideFin } from "@/app/(espace-pro)/_components/DepotRapideFin"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export const WidgetEntrepriseMiseEnRelation = () => {
  return (
    <DepotSimplifieLayout>
      <DepotRapideFin />
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}

export default WidgetEntrepriseMiseEnRelation
