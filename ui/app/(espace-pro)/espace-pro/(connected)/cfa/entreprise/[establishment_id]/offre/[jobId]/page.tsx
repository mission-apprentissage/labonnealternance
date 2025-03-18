"use client"

import { useParams, useRouter } from "next/navigation"

import UpsertOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/UpsertOffre"
import { PAGES } from "@/utils/routes.utils"

export default function Page() {
  const router = useRouter()
  const { establishment_id, jobId } = useParams() as { establishment_id: string; jobId: string }

  return <UpsertOffre establishment_id={establishment_id} job_id={jobId} onSuccess={() => router.push(PAGES.dynamic.backCfaPageEntreprise(establishment_id).getPath())} />
}
