import { redirect } from "next/navigation"
import { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import JobOfferRendererClient from "@/app/(candidat)/emploi/[type]/[id]/JobDetailRendererClient"
import { apiGet } from "@/utils/api.utils"

export default async function JobOfferPage({ params }: { params: Promise<{ type: LBA_ITEM_TYPE; id: string }> }) {
  const { type, id } = await params
  if (!type || !id) redirect("/404")

  // let job: ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson | null

  // switch (type) {
  //   case LBA_ITEM_TYPE.RECRUTEURS_LBA:
  //     job = (await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as Jsonify<ILbaItemLbaCompanyJson>
  //     break

  //   case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
  //     job = (await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemLbaJobJson
  //     break

  //   case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
  //     job = (await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemPartnerJobJson
  //     break

  //   default:
  //     break
  // }

  const typeToJobMap = {
    [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "ILbaItemLbaCompanyJson",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "ILbaItemLbaJobJson",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: "ILbaItemPartnerJobJson",
  } as const

  const job = type in typeToJobMap ? ((await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemJobsGlobal) : null

  if (!job) redirect("/404")

  // @ts-ignore TODO
  return <JobOfferRendererClient selectedItem={job as ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson} />
}
