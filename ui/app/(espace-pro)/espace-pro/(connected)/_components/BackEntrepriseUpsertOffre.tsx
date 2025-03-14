"use client"

import { useParams, useRouter } from "next/navigation"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { PAGES } from "@/utils/routes.utils"

export function BackEntrepriseUpsertOffre({ creation }: { creation: boolean }) {
  const router = useRouter()
  const { establishment_id, job_id } = useParams() as { establishment_id: string; job_id: string }
  const { user } = useConnectedSessionClient()

  const onSuccess = creation
    ? () => router.push(PAGES.dynamic.backCreationFin({ establishment_id }).getPath())
    : () => router.push(PAGES.dynamic.successEditionOffre({ userType: user.type, establishment_id, user_id: user._id }).getPath())

  return (
    <DepotSimplifieStyling>
      <UpsertOffre establishment_id={establishment_id} job_id={job_id} onSuccess={onSuccess} />
    </DepotSimplifieStyling>
  )
}
