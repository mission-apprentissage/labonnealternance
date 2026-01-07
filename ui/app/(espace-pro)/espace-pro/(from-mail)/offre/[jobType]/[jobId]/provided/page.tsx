import type { Metadata } from "next"
import { OffreActionPage } from "@/app/(espace-pro)/espace-pro/(from-mail)/offre/[jobType]/[jobId]/OffreActionPage"

export const metadata: Metadata = {
  title: "Confirmation de l'offre pourvue - La bonne alternance",
}

export default async function Page({ params, searchParams }) {
  const { jobType, jobId } = await params
  const { token } = await searchParams
  return <OffreActionPage jobId={jobId} token={token} jobType={jobType} action="provided" />
}
