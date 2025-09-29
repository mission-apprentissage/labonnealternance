import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, /*ILbaItemLbaJobJson, */ ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import JobDetailRendererClient from "@/app/(candidat)/emploi/[type]/[id]/[intitule-offre]/JobDetailRendererClient"
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
        // @ts-ignore
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

  const typeToJobMap = {
    [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "ILbaItemLbaCompanyJson",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "ILbaItemPartnerJobJson",
    [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: "ILbaItemPartnerJobJson",
  } as const

  const job = type in typeToJobMap ? ((await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })) as ILbaItemJobsGlobal) : null

  if (!job) redirect("/404")

  return (
    <>
      <SkipLinks
        links={[
          { label: "En-tête", anchor: "#detail-header" },
          { label: "Contenu", anchor: "#detail-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <JobDetailRendererClient
        job={job as ILbaItemLbaCompanyJson /*| ILbaItemLbaJobJson*/ | ILbaItemPartnerJobJson}
        rechercheParams={parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)}
      />
    </>
  )
}
