import { Metadata } from "next"
import { redirect } from "next/navigation"
import { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import JobDetailRendererClient from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/JobDetailRendererClient"
import { parseRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"
import { apiGet } from "@/utils/api.utils"

const typeToJobMap = {
  [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "ILbaItemLbaCompanyJson",
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "ILbaItemLbaJobJson",
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: "ILbaItemPartnerJobJson",
} as const

export async function generateMetadata({ params }): Promise<Metadata> {
  const { type, id } = await params
  const job = type in typeToJobMap ? ((await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemJobsGlobal) : null

  if (!job) return { title: "Offre d'emploi introuvable" }

  let title = ""
  if (job) {
    switch (type) {
      case LBA_ITEM_TYPE.RECRUTEURS_LBA:
        title = `Candidature spontanée en ${job?.nafs[0]?.label} chez ${job.title}`
        break
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
        title = `Offre d'emploi ${job?.title}`
        break
    }
  }
  return {
    title: `${title} - La bonne alternance`,
  }
}

export default async function JobOfferPage({ params, searchParams }: { params: Promise<{ type: LBA_ITEM_TYPE; id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { type, id } = await params
  if (!type || !id) redirect("/404")

  const job = type in typeToJobMap ? ((await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemJobsGlobal) : null

  if (!job) redirect("/404")

  return (
    <>
      <JobDetailRendererClient
        job={job as ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson}
        params={parseRecherchePageParams(new URLSearchParams(await searchParams), "default")}
      />
    </>
  )
}
