"use client"

import { useParams, useRouter } from "next/navigation"
import { ADMIN } from "shared/constants/recruteur"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

export default function UpdateOffre() {
  const router = useRouter()
  const { establishment_id, job_id, userId } = useParams() as { establishment_id: string; job_id: string; userId: string }
  const { raison_sociale } = useSearchParamsRecord()
  return (
    <>
      <Breadcrumb
        pages={[
          PAGES.static.backAdminHome,
          PAGES.dynamic.backAdminRecruteurOffres({ user_id: userId }),
          PAGES.dynamic.offreUpsert({ offerId: job_id, establishment_id, userType: ADMIN, raison_sociale }),
        ]}
      />
      <UpsertOffre
        establishment_id={establishment_id}
        job_id={job_id}
        onSuccess={() => router.push(PAGES.dynamic.successEditionOffre({ establishment_id, userType: "ADMIN", user_id: userId }).getPath())}
      />
    </>
  )
}
