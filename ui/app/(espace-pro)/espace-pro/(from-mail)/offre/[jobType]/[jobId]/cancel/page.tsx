import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { OffreActionPage } from "@/app/(espace-pro)/espace-pro/(from-mail)/offre/[jobType]/[jobId]/OffreActionPage"
export const metadata: Metadata = {
  title: "Annuler une offre - La bonne alternance",
}

export default async function Page({ params, searchParams }) {
  const { jobType, jobId } = await params
  if (jobType !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    notFound()
  }
  const { token } = await searchParams
  return <OffreActionPage jobId={jobId} token={token} />
}
