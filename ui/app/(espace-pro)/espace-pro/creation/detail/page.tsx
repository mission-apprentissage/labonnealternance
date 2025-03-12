"use client"

import { InformationCreationCompte } from "@/components/espace_pro/Authentification/InformationCreationCompte"
import { DepotSimplifieLayout } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function CreationDetail() {
  const { siret, email, type, origin } = useSearchParamsRecord()

  return (
    <DepotSimplifieLayout>
      <InformationCreationCompte establishment_siret={siret} email={email} type={type as "CFA" | "ENTREPRISE"} origin={origin} />
    </DepotSimplifieLayout>
  )
}
