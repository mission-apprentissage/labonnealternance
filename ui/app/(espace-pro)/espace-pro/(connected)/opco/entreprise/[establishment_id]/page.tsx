"use client"

import { useParams } from "next/navigation"

import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function EntrepriseJobList() {
  const { establishment_id } = useParams() as { establishment_id: string }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backOpcoHome, PAGES.dynamic.backOpcoEditionEntreprise({ establishment_id })]} />
      <ListeOffres hideModify={true} establishment_id={establishment_id} />
    </>
  )
}
