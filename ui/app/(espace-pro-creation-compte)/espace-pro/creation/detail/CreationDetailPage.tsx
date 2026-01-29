"use client"

import { InformationCreationCompte } from "@/app/(espace-pro-creation-compte)/_components/InformationCreationCompte/InformationCreationCompte"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function CreationDetail() {
  const { siret, email, type, origin } = useSearchParamsRecord()

  return <InformationCreationCompte establishment_siret={siret} email={email} type={type as "CFA" | "ENTREPRISE"} origin={origin} />
}
