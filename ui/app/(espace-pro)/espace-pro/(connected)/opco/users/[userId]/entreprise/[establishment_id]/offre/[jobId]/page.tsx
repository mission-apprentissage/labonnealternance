"use client"

import { useParams, useRouter } from "next/navigation"
import { OPCO } from "shared/constants/recruteur"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function Page() {
  const router = useRouter()
  const { userId, establishment_id, jobId } = useParams() as { userId: string; establishment_id: string; jobId: string }
  const { raison_sociale } = useSearchParamsRecord()

  return (
    <>
      <Breadcrumb
        pages={[
          PAGES.static.backOpcoHome,
          PAGES.dynamic.backOpcoInformationEntreprise({ user_id: userId, user_label: raison_sociale }),
          PAGES.dynamic.offreUpsert({ establishment_id, offerId: jobId, userType: OPCO }),
        ]}
      />
      <UpsertOffre
        establishment_id={establishment_id}
        job_id={jobId}
        onSuccess={() => router.push(PAGES.dynamic.backOpcoInformationEntreprise({ user_id: userId, user_label: raison_sociale }).getPath())}
      />
    </>
  )
}
