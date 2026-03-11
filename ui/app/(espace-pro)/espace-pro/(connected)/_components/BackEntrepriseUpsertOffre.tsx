"use client"

import { useRouter } from "next/navigation"
import { ENTREPRISE } from "shared/constants/recruteur"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { PAGES } from "@/utils/routes.utils"
import UpsertOffre from "./UpsertOffre"

export function BackEntrepriseUpsertOffre({ establishment_id, job_id }: { establishment_id: string; job_id?: string }) {
  const router = useRouter()
  const { user } = useConnectedSessionClient()

  return (
    <DepotSimplifieStyling>
      <Breadcrumb pages={[PAGES.static.backHomeEntreprise, PAGES.dynamic.offreUpsert({ establishment_id, offerId: job_id, userType: ENTREPRISE })]} />
      <UpsertOffre
        establishment_id={establishment_id}
        job_id={job_id}
        onSuccess={() => setTimeout(() => router.push(PAGES.dynamic.successEditionOffre({ userType: user.type, establishment_id, user_id: user._id }).getPath()), 2000)}
      />
    </DepotSimplifieStyling>
  )
}
