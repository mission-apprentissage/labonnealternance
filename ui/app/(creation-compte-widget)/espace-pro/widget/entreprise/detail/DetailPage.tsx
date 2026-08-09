"use client"

import { InformationCreationCompte } from "@/app/(espace-pro-creation-compte)/_components/InformationCreationCompte/InformationCreationCompte"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"

export const WidgetEntrepriseDetail = () => {
  const { siret, type, origin } = useSearchParamsRecord()

  return <InformationCreationCompte isWidget={true} establishment_siret={siret} type={type as "CFA" | "ENTREPRISE"} origin={origin} />
}

export default WidgetEntrepriseDetail
