"use client"

import { useParams, useRouter } from "next/navigation"
import { OPCO } from "shared/constants/recruteur"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function Page() {
  const router = useRouter()
  const { establishment_id, jobId } = useParams() as { establishment_id: string; jobId: string }

  return (
    <>
      <Breadcrumb
        pages={[
          PAGES.static.backOpcoHome,
          PAGES.dynamic.backOpcoOffresEntreprise({ establishment_id }),
          PAGES.dynamic.offreUpsert({ establishment_id, offerId: jobId, userType: OPCO }),
        ]}
      />
      <UpsertOffre establishment_id={establishment_id} job_id={jobId} onSuccess={() => router.push(PAGES.dynamic.backOpcoOffresEntreprise({ establishment_id }).getPath())} />
    </>
  )
}
