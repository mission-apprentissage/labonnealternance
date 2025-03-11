import { redirect } from "next/navigation"
import { ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

// import JobOfferRendererClient from "@/app/(candidat)/emploi/[type]/[id]/JobDetailRendererClient"
import { apiGet } from "@/utils/api.utils"

export default async function JobOfferPage({ params }: { params: Promise<{ type: LBA_ITEM_TYPE; id: string }> }) {
  const { type, id } = await params
  if (!type || !id) redirect("/404")
  let job: ILbaItemFtJob[] | ILbaItemLbaCompany[] | ILbaItemLbaJob[] | ILbaItemPartnerJob[] | null = null

  switch (type) {
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      job = (await apiGet("/v1/jobs/company/:siret", { params: { siret: id }, querystring: {} })) as ILbaItemLbaCompany[]
      break

    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      job = (await apiGet("/v1/jobs/matcha/:id", { params: { id }, querystring: {} })) as ILbaItemLbaJob[]
      break

    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
      job = (await apiGet("/v1/jobs/partnerJob/:id", { params: { id }, querystring: {} })) as ILbaItemPartnerJob[]
      break

    default:
      break
  }

  console.log(job)
  return JSON.stringify(job)
  // return <JobOfferRendererClient selectedItem={job} />
}
