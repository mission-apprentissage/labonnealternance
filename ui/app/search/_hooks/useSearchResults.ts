import { useInfiniteQuery } from "@tanstack/react-query"

import { apiGet } from "@/utils/api.utils"

import type { ISearchPageParams } from "../_utils/search.params.utils"

function paramsToQuerystring(params: ISearchPageParams) {
  const qs: Record<string, unknown> = {
    radius: params.radius,
    hitsPerPage: params.hitsPerPage,
  }
  if (params.q) qs.q = params.q
  // type_filter_label : l'API accepte une seule valeur — on envoie le premier élément
  if (params.type_filter_label?.length) qs.type_filter_label = params.type_filter_label[0]
  if (params.contract_type?.length) qs.contract_type = params.contract_type
  if (params.level?.length) qs.level = params.level[0]
  if (params.activity_sector?.length) qs.activity_sector = params.activity_sector[0]
  if (params.organization_name) qs.organization_name = params.organization_name
  if (params.latitude !== undefined) qs.latitude = params.latitude
  if (params.longitude !== undefined) qs.longitude = params.longitude
  return qs
}

export function useSearchResults(params: ISearchPageParams) {
  // page exclu du queryKey — chaque page est chargée via pageParam par useInfiniteQuery
  const baseQs = paramsToQuerystring(params)

  return useInfiniteQuery({
    queryKey: ["/v1/search", baseQs],
    queryFn: ({ signal, pageParam }) => apiGet("/v1/search", { querystring: { ...baseQs, page: pageParam } as never }, { signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPageParam + 1 < lastPage.nbPages) return lastPageParam + 1
      return undefined
    },
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
}
