import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import type { Metadata } from "next"
import { cacheLife, cacheTag } from "next/cache"
import { notFound } from "next/navigation"
import type { ILbaItemLbaCompanyJson, /*ILbaItemLbaJobJson, */ ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrlPath } from "shared/metier/lbaitemutils"
import { WidgetAwareHeader } from "@/app/_components/WidgetAwareHeader"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import { ApiError, apiGet } from "@/utils/api.utils"
import JobDetailRendererClient from "./JobDetailRendererClient"

export async function generateMetadata({ params }): Promise<Metadata> {
  const { type, id } = await params
  const job = await getOffreOption(type, id)
  if (!job) return { title: "Offre d'emploi introuvable" }

  let title = ""
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
  // `id` arrive percent-encodé dans params et buildJobUrlPath ré-encode : on décode d'abord
  // pour éviter un double encodage. Repli sur l'id brut si le segment n'est pas décodable
  // (ex : `%` isolé) plutôt que de faire échouer generateMetadata sur une URIError.
  let decodedId: string
  try {
    decodedId = decodeURIComponent(id)
  } catch {
    decodedId = id
  }

  return {
    title: `${title} - La bonne alternance`,
    alternates: {
      // URL canonique sans query params : une même offre accessible avec des paramètres de recherche
      // ou de tracking différents ne doit compter que comme une seule page pour les moteurs.
      // Relative, résolue en absolu par le metadataBase du layout racine (convention du codebase).
      canonical: buildJobUrlPath(type, decodedId, job.title || undefined),
    },
  }
}

export default async function JobOfferPage({ params, searchParams }: { params: Promise<{ type: LBA_ITEM_TYPE; id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { type, id } = await params
  const job = await getOffreOption(type, id)
  if (!job) notFound()

  return (
    <>
      <SkipLinks
        links={[
          { label: "En-tête", anchor: "#detail-header" },
          { label: "Contenu", anchor: "#detail-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <InfoBanner />
      <WidgetAwareHeader />
      <JobDetailRendererClient
        job={job as ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson}
        rechercheParams={parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)}
      />
    </>
  )
}

const acceptedTypes = [LBA_ITEM_TYPE.RECRUTEURS_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]

async function getOffreOption(type: LBA_ITEM_TYPE, id: string) {
  // `apiGet` lit toujours `headers()` en interne (pour transmettre le cookie de session),
  // ce qui est interdit dans un `"use cache"` classique — seul `"use cache: private"` l'autorise
  // (cache navigateur uniquement, jamais côté serveur).
  "use cache: private"
  if (!type || !id || !acceptedTypes.includes(type)) return null

  cacheTag(`offer:${type}:${id}`)
  cacheLife({ revalidate: 300 }) // 5 minutes, aligné sur l'ancien `revalidate = 300`

  try {
    const offre = await apiGet("/_private/jobs/:source/:id", { params: { source: type, id } })
    return offre
  } catch (err) {
    if (err && err instanceof ApiError && err.context.statusCode === 404) {
      return null
    }
    throw err
  }
}
