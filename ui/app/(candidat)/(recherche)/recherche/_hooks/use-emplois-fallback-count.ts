import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/utils/api.utils"
import { readOpcoFilterCookie } from "@/utils/opco-search-filter.utils"

import { emploisFallbackParams } from "../_utils/mode-fallback.utils"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import type { useSearchResults } from "./use-search-results"
import { paramsToQuerystring } from "./use-search-results"

export type EmploisFallbackCount = { status: "idle" } | { status: "pending" } | { status: "done"; count: number }

/** Le comptage n'a lieu qu'à l'état vide définitif d'une recherche en mode emplois_formation. */
export function shouldCountEmploisFallback(params: ISearchPageParams, result: ReturnType<typeof useSearchResults>, stillWidening: boolean): boolean {
  return params.mode === "emplois_formation" && Boolean(result.data) && !result.isPlaceholderData && !result.isFetching && result.data?.pages.at(-1)?.nbHits === 0 && !stillWidening
}

/**
 * `retry: false` : l'état vide attend ce comptage pour s'afficher, les tentatives par défaut de
 * React Query le retarderaient de plusieurs secondes sur une erreur (5xx, 429 de nginx).
 */
export function emploisFallbackQueryOptions(qs: Record<string, unknown>) {
  return {
    queryKey: ["/v1/search", "emplois-fallback-count", qs],
    queryFn: ({ signal }: { signal: AbortSignal }) => apiGet("/v1/search", { querystring: qs as never }, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: false,
    throwOnError: false,
  } as const
}

export function toEmploisFallbackCount(enabled: boolean, query: { isPending: boolean; data?: { nbHits?: number } }): EmploisFallbackCount {
  if (!enabled) return { status: "idle" }
  if (query.isPending) return { status: "pending" }
  // En erreur, l'état vide s'affiche sans proposition.
  return { status: "done", count: query.data?.nbHits ?? 0 }
}

/**
 * Nombre de résultats que trouverait la même recherche en mode emplois (#5637). `purpose` marque
 * l'appel dans search_queries : il n'est pas compté comme une recherche de l'usager.
 */
export function useEmploisFallbackCount(params: ISearchPageParams, result: ReturnType<typeof useSearchResults>, stillWidening: boolean): EmploisFallbackCount {
  const enabled = shouldCountEmploisFallback(params, result, stillWidening)
  // Même repli sur le cookie OPCO que useSearchResults.
  const opco = params.opco ?? (typeof document === "undefined" ? undefined : readOpcoFilterCookie(document.cookie))
  const qs = { ...paramsToQuerystring({ ...emploisFallbackParams(params), opco }), page: 0, hitsPerPage: 1, purpose: "mode_fallback_count" }

  const query = useQuery({ ...emploisFallbackQueryOptions(qs), enabled })
  return toEmploisFallbackCount(enabled, query)
}
