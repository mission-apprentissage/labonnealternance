import { redirect } from "next/navigation"
import { ILbaItemJobsGlobal, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import JobOfferRendererClient from "@/app/(candidat)/emploi/[type]/[id]/JobDetailRendererClient"
import { apiGet } from "@/utils/api.utils"

export default async function JobOfferPage({ params }: { params: Promise<{ type: LBA_ITEM_TYPE; id: string }> }) {
  const { type, id } = await params
  if (!type || !id) redirect("/404")

  // let job: ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob | null

  // switch (type) {
  //   case LBA_ITEM_TYPE.RECRUTEURS_LBA:
  //     job = (await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as Jsonify<ILbaItemLbaCompany>
  //     break

  //   case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
  //     job = (await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemLbaJob
  //     break

  //   case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
  //     job = (await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemPartnerJob
  //     break

  //   default:
  //     break
  // }

  const typeToJobMap = {
    [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "ILbaItemLbaCompany",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "ILbaItemLbaJob",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: "ILbaItemPartnerJob",
  } as const

  const job = type in typeToJobMap ? ((await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemJobsGlobal) : null

  if (!job) redirect("/404")

  console.log(job)
  // @ts-ignore TODO
  return <JobOfferRendererClient selectedItem={job as ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemPartnerJob} />
}
