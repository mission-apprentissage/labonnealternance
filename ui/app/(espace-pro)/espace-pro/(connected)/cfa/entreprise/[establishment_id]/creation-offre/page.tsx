"use client"

import { useParams, useRouter } from "next/navigation"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { PAGES } from "@/utils/routes.utils"

function EntrepriseCreationOffrePage() {
  const router = useRouter()
  const { establishment_id } = useParams() as { establishment_id: string }

  return (
    <DepotSimplifieStyling>
      <UpsertOffre establishment_id={establishment_id} onSuccess={() => router.push(PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath())} />
    </DepotSimplifieStyling>
  )
}

export default EntrepriseCreationOffrePage
