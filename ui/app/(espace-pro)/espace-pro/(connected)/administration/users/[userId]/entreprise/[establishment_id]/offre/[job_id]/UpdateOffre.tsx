"use client"

import { useParams, useRouter } from "next/navigation"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { PAGES } from "@/utils/routes.utils"

export function UpdateOffre() {
  const router = useRouter()
  const { establishment_id, job_id, userId } = useParams() as { establishment_id: string; job_id: string; userId: string }

  return (
    <UpsertOffre
      establishment_id={establishment_id}
      job_id={job_id}
      onSuccess={() => router.push(PAGES.dynamic.successEditionOffre({ establishment_id, userType: "ADMIN", user_id: userId }).getPath())}
    />
  )
}
