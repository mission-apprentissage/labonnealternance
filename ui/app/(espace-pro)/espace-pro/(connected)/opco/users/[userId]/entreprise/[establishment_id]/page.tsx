"use client"

import { useParams } from "next/navigation"

import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function EntrepriseJobList() {
  const { establishment_id } = useParams() as { establishment_id: string }
  const { raison_sociale } = useSearchParamsRecord()

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backOpcoHome, PAGES.dynamic.backOpcoOffresEntreprise({ establishment_id, raison_sociale })]} />
      <ListeOffres hideModify={true} establishment_id={establishment_id} />
    </>
  )
}
