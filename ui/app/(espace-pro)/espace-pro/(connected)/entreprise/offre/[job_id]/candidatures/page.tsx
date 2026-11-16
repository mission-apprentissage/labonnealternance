import type { Metadata } from "next"
import { CandidaturesOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidaturesOffre"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.dynamic.backEntrepriseCandidaturesOffre().title,
}

export default async function Page({ params }: { params: Promise<{ job_id: string }> }) {
  const { job_id } = await params
  return <CandidaturesOffre job_id={job_id} />
}
