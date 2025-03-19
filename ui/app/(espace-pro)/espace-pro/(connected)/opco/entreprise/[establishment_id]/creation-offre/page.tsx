"use client"

import { useParams, useRouter } from "next/navigation"
import { OPCO } from "shared/constants/index"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function Page() {
  const router = useRouter()
  const { establishment_id } = useParams() as { establishment_id: string }

  return (
    <>
      <Breadcrumb
        pages={[
          PAGES.static.backOpcoHome,
          PAGES.dynamic.backOpcoOffresEntreprise({ establishment_id }),
          PAGES.dynamic.offreUpsert({ establishment_id, offerId: "creation", userType: OPCO }),
        ]}
      />
      <UpsertOffre establishment_id={establishment_id} onSuccess={() => router.push(PAGES.dynamic.backOpcoOffresEntreprise({ establishment_id }).getPath())} />
    </>
  )
}
