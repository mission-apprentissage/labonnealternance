import { InformationCreationCompte } from "@/components/espace_pro/Authentification/InformationCreationCompte"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"

export const WidgetEntrepriseDetail = () => {
  return (
    <DepotSimplifieLayout>
      <InformationCreationCompte isWidget={true} />
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}

export default WidgetEntrepriseDetail
