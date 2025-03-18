"use client"

import { useParams, useRouter } from "next/navigation"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function EntrepriseCreationOffrePage() {
  const router = useRouter()
  const { establishment_id } = useParams() as { establishment_id: string }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.dynamic.backCfaPageEntreprise(establishment_id), PAGES.dynamic.backCfaEntrepriseCreationOffre(establishment_id)]} />
      <UpsertOffre establishment_id={establishment_id} onSuccess={() => router.push(PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath())} />
    </>
  )
}
