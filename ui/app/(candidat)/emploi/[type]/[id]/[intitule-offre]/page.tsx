import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import type { ILbaItemJobsGlobal, ILbaItemLbaCompanyJson, /*ILbaItemLbaJobJson, */ ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import JobDetailRendererClient from "./JobDetailRendererClient"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { apiGet } from "@/utils/api.utils"

// Désactive le streaming SSR pour éviter l'erreur "transformAlgorithm is not a function"
// avec Next.js 16 quand les connexions sont interrompues (healthchecks, timeouts, etc.)
// Voir: https://github.com/vercel/next.js/discussions/75995
// Context: PRs #2474-2479, Sentry issue https://sentry.apprentissage.beta.gouv.fr/organizations/sentry/issues/6/
export const dynamic = "force-dynamic"
export const revalidate = 300 // Cache ISR pendant 5 minutes

const typeToJobMap = {
  [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "ILbaItemLbaCompanyJson",
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "ILbaItemPartnerJobJson",
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
        job={job as ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson}
        rechercheParams={parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)}
      />
    </>
  )
}
