import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

import { DepotRapideFin } from "../../creation/fin"

export const WidgetEntrepriseMiseEnRelation = () => {
  return (
    <DepotSimplifieLayout>
      <DepotRapideFin />
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}

export default WidgetEntrepriseMiseEnRelation
