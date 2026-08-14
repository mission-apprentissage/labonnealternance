import { Suspense } from "react"
import type { IGetRoutes, IResponse } from "shared"

import { apiGet } from "@/utils/api.utils"

import { paramsToQuerystring } from "../_hooks/use-search-results"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildHitDetailUrl, buildRechercheH1, buildSearchUrl } from "../_utils/search.params.utils"

const MAX_SEO_OFFERS = 10

/**
 * Contenu SEO server-rendered de la page `/recherche`, rendu `sr-only` (invisible à l'écran) :
 * - un H1 dynamique « Alternance {métier}{ à {lieu}} », présent dès le HTML initial — la page
 *   n'en a sinon aucun, tout le rendu visible étant piloté par le client `SearchPageClient` ;
 * - les premières offres en vrais liens `<a href>` (maillage interne + contenu indexable).
 * 100 % additif : ne remplace pas le rendu client interactif.
 */
export function RechercheSeoContent({ params }: { params: ISearchPageParams }) {
  const h1 = buildRechercheH1(params)
  const hasSearch = Boolean(params.q?.trim())

  return (
    <div className="fr-sr-only">
      {h1 && <h1>{h1}</h1>}
      {hasSearch && (
        <Suspense fallback={null}>
          <RechercheSeoOffers params={params} />
        </Suspense>
      )}
    </div>
  )
}

async function RechercheSeoOffers({ params }: { params: ISearchPageParams }) {
  let data: IResponse<IGetRoutes["/v1/search"]>
  try {
    // `internal: "true"` : ce fetch SSR n'est pas une recherche utilisateur, il rejoue le même
    // `q` que le fetch client initial — exclu du log analytics de recherche côté serveur.
    data = await apiGet("/v1/search", { querystring: { ...paramsToQuerystring(params), page: 0, hitsPerPage: MAX_SEO_OFFERS, internal: "true" } as never })
  } catch {
    // Fail-safe : une erreur/lenteur de l'API ne doit jamais casser la page. On omet le bloc offres.
    return null
  }

  if (data.hits.length === 0) return null

  const jobName = params.q?.trim()
  const lieu = params.lieu_label?.trim()
  const currentSearchUrl = buildSearchUrl(params)

  return (
    <section aria-label="Aperçu des offres en alternance">
      <p>
        {data.hits.length} offre{data.hits.length > 1 ? "s" : ""} en alternance{jobName ? ` ${jobName}` : ""}
        {lieu ? ` à ${lieu}` : ""} disponibles. Postulez gratuitement sur le service public de l'alternance.
      </p>
      <ul>
        {data.hits.map((hit) => (
          <li key={`${hit.sub_type}-${hit.url_id}`}>
            <a href={buildHitDetailUrl({ sub_type: hit.sub_type ?? "", url_id: hit.url_id ?? "", title: hit.title ?? "" }, currentSearchUrl)}>
              {[hit.title, hit.organization_name, hit.address].filter(Boolean).join(" — ")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
