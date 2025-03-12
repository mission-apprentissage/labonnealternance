"use client"

import { InformationCreationCompte } from "@/components/espace_pro/Authentification/InformationCreationCompte"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { WidgetFooter } from "@/components/WidgetFooter/WidgetFooter"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export const WidgetEntrepriseDetail = () => {
  const { siret, type, origin } = useSearchParamsRecord()

  return (
    <DepotSimplifieLayout>
      <InformationCreationCompte isWidget={true} establishment_siret={siret} type={type as "CFA" | "ENTREPRISE"} origin={origin} />
      <WidgetFooter />
    </DepotSimplifieLayout>
  )
}

export default WidgetEntrepriseDetail
