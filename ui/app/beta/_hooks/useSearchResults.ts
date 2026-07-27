import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"

import { apiGet } from "@/utils/api.utils"

import type { ISearchPageParams } from "../_utils/search.params.utils"

function paramsToQuerystring(params: ISearchPageParams) {
  const qs: Record<string, unknown> = {
    radius: params.radius,
    hitsPerPage: params.hitsPerPage,
  }
  if (params.q) qs.q = params.q
  // Télémétrie moteur de suggestion : origine de q (suggestion sélectionnée vs texte libre)
  if (params.q && params.q_source) qs.source = params.q_source
  // Toujours envoyé : le mode par défaut « emplois » exclut les formations et les offres CFA/GEIQ côté API
  qs.mode = params.mode
  if (params.type_filter_label?.length) qs.type_filter_label = params.type_filter_label
  if (params.contract_type?.length) qs.contract_type = params.contract_type
  if (params.level?.length) qs.level = params.level
  if (params.activity_sector?.length) qs.activity_sector = params.activity_sector
  if (params.organization_name) qs.organization_name = params.organization_name
  if (params.start_date) qs.start_date = params.start_date
  if (params.urgent) qs.start_type = "des_que_possible"
  if (params.handi) qs.is_disabled_elligible = "true"
  if (params.smart_apply) qs.smart_apply = "true"
  // Un seul type d'offres coché → filtre API ; les deux cochés (ou aucun) → pas de filtre,
  // la sélection « tout » équivaut à l'absence de filtre.
  if (params.is_algo_company?.length === 1) qs.is_algo_company = params.is_algo_company[0].toString()
  if (params.sort) qs.sort = params.sort
  if (params.latitude !== undefined) qs.latitude = params.latitude
  if (params.longitude !== undefined) qs.longitude = params.longitude
  return qs
}

export function useSearchResults(params: ISearchPageParams, { enabled = true }: { enabled?: boolean } = {}) {
  // page exclu du queryKey — chaque page est chargée via pageParam par useInfiniteQuery
  const baseQs = paramsToQuerystring(params)

  return useInfiniteQuery({
    queryKey: ["/v1/search", baseQs],
    queryFn: ({ signal, pageParam }) => apiGet("/v1/search", { querystring: { ...baseQs, page: pageParam } as never }, { signal }),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPageParam + 1 < lastPage.nbPages) return lastPageParam + 1
      return undefined
    },
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
    // Conserve les données précédentes (résultats + facettes) pendant le rechargement
    // déclenché par un changement de filtre → évite le flicker des filtres et de la liste.
    placeholderData: keepPreviousData,
  })
}
