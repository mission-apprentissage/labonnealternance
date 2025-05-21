"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { getFormulaire } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

export default function Page() {
  const { establishment_id } = useParams() as { establishment_id: string }

  const { data: recruiter, isLoading } = useQuery({
    queryKey: ["recruiter", establishment_id],
    enabled: Boolean(establishment_id),
    queryFn: () => getFormulaire(establishment_id),
  })

  if (!establishment_id || isLoading) {
    return <LoadingEmptySpace />
  }

  const establishmentLabel = recruiter.establishment_raison_sociale ?? recruiter.establishment_siret

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.dynamic.backCfaPageEntreprise(establishment_id, establishmentLabel)]} />
      <ListeOffres showStats={true} establishment_id={establishment_id} />
    </>
  )
}
