import { Suspense } from "react"
import type { IGetRoutes, IResponse } from "shared"
import type { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import type { IRecherchePageParams, ItemReferenceLike } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { getItemReference, getResultItemUrl } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { buildJobsMinQuerystring, buildRechercheH1 } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.seo.utils"
import { apiGet } from "@/utils/api.utils"

const MAX_SEO_OFFERS = 10

/** Offre normalisée pour l'affichage SEO : la référence (pour l'URL) + un libellé textuel. */
type SeoOffer = { ref: ItemReferenceLike & { id: string }; label: string }

/** Forme minimale commune aux 3 buckets d'offres renvoyés par `/v1/_private/jobs/min`. */
type SeoJobSource = {
  id: string | null
  ideaType: LBA_ITEM_TYPE_OLD
  title?: string | null
  company?: { name?: string | null } | null
  place?: { city?: string | null } | null
}

function extractSeoOffers(data: IResponse<IGetRoutes["/v1/_private/jobs/min"]>): SeoOffer[] {
  const buckets = [data.lbaJobs, data.partnerJobs, data.lbaCompanies]
  const sources = buckets.flatMap((bucket) => (bucket && "results" in bucket ? (bucket.results as SeoJobSource[]) : []))

  const offers: SeoOffer[] = []
  for (const source of sources) {
    if (!source.id) continue
    const label = [source.title, source.company?.name, source.place?.city].filter(Boolean).join(" — ")
    if (!label) continue
    offers.push({ ref: { id: source.id, ideaType: source.ideaType }, label })
  }
  return offers
}

/**
 * Contenu SEO server-rendered des pages `/recherche`, rendu `sr-only` (invisible à l'écran) :
 * - un H1 dynamique « Alternance {métier}{ à {ville}} » présent dès le HTML initial ;
 * - les premières offres en vrais liens `<a href>` (maillage interne + contenu indexable).
 * 100 % additif : ne remplace pas le rendu client interactif.
 */
export function RechercheSeoContent({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const h1 = buildRechercheH1(rechercheParams)
  const hasSearch = rechercheParams.romes.length > 0 || Boolean(rechercheParams.rncp)

  return (
    <div className="fr-sr-only">
      {h1 && <h1>{h1}</h1>}
      {hasSearch && (
        <Suspense fallback={null}>
          <RechercheSeoOffers rechercheParams={rechercheParams} />
        </Suspense>
      )}
    </div>
  )
}

async function RechercheSeoOffers({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  let offers: SeoOffer[] = []
  try {
    const data = await apiGet("/v1/_private/jobs/min", { querystring: buildJobsMinQuerystring({ ...rechercheParams, elligibleHandicapFilter: false }) })
    offers = extractSeoOffers(data).slice(0, MAX_SEO_OFFERS)
  } catch {
    // Fail-safe : une erreur/lenteur de l'API ne doit jamais casser la page. On omet le bloc offres.
    return null
  }

  if (offers.length === 0) return null

  const jobName = rechercheParams.job_name?.trim()
  const address = rechercheParams.geo?.address?.trim()
  const lieu = address ? ` à ${address}` : ""

  return (
    <section aria-label="Aperçu des offres en alternance">
      <p>
        {offers.length} offre{offers.length > 1 ? "s" : ""} en alternance{jobName ? ` ${jobName}` : ""}
        {lieu} disponibles. Postulez gratuitement sur le service public de l'alternance.
      </p>
      <ul>
        {offers.map((offer) => (
          <li key={`${offer.ref.ideaType}-${offer.ref.id}`}>
            <a href={getResultItemUrl(offer.ref, { ...rechercheParams, activeItems: [getItemReference(offer.ref)] })}>{offer.label}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}
