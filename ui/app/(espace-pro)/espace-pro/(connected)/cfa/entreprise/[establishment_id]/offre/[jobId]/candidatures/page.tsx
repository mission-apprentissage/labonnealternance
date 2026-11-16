import type { Metadata } from "next"
import { CandidaturesOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidaturesOffre"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.dynamic.backEntrepriseCandidaturesOffre().title,
}

export default async function Page({ params }: { params: Promise<{ establishment_id: string; jobId: string }> }) {
  const { establishment_id, jobId } = await params
  return <CandidaturesOffre job_id={jobId} cfaEstablishmentId={establishment_id} />
}
