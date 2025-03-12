import { redirect } from "next/navigation"
import { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import JobOfferRendererClient from "@/app/(candidat)/emploi/[type]/[id]/JobDetailRendererClient"
import { apiGet } from "@/utils/api.utils"

export default async function JobOfferPage({ params }: { params: Promise<{ type: LBA_ITEM_TYPE; id: string }> }) {
  const { type, id } = await params
  if (!type || !id) redirect("/404")

  const typeToJobMap = {
    [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "ILbaItemLbaCompany",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "ILbaItemLbaJob",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: "ILbaItemPartnerJob",
  } as const

  type JobType = ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | null

  const job: JobType = type in typeToJobMap ? ((await apiGet("/v2/_private/jobs/:source/:id", { params: { source: type, id } })) as JobType) : null
  if (!job) redirect("/404")

  console.log(job)
  // return JSON.stringify(job)
  return <JobOfferRendererClient selectedItem={job} />
}
