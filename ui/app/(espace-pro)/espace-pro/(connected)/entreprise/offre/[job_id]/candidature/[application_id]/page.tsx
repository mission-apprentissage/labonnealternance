import type { Metadata } from "next"
import { CandidatureDetail } from "@/app/(espace-pro)/espace-pro/(connected)/_components/CandidatureDetail"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.dynamic.backEntrepriseCandidatureDetail().title,
}

export default async function Page({ params }: { params: Promise<{ job_id: string; application_id: string }> }) {
  const { job_id, application_id } = await params
  return <CandidatureDetail job_id={job_id} application_id={application_id} />
}
