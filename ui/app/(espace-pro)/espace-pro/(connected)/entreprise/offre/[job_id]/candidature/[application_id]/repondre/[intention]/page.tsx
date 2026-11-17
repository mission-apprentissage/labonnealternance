import type { Metadata } from "next"
import { CandidatureReponse } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidatureReponse"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.dynamic.backEntrepriseCandidatureReponse().title,
}

export default async function Page({ params }: { params: Promise<{ job_id: string; application_id: string; intention: string }> }) {
  const { job_id, application_id, intention } = await params
  return <CandidatureReponse job_id={job_id} application_id={application_id} intention={intention} />
}
