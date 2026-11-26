import { ApiError } from "@/utils/api.utils"

export const RATE_LIMITED_MESSAGE = "Trop de recherches ont été lancées en peu de temps. Réessayez dans quelques secondes."

const isRateLimited = (error: unknown) => error instanceof ApiError && error.context.statusCode === 429

/**
 * Relances par défaut de React Query dans le navigateur (3), sauf sur 429 : elles tombent dans la
 * même fenêtre de limite et retardent le message d'environ 7 s (cf. #6058). Statut seul, le corps
 * du 429 diffère entre nginx et Fastify.
 */
export const shouldRetrySearch = (failureCount: number, error: unknown) => !isRateLimited(error) && failureCount < 3

export type SearchResultsErrorDisplay = "none" | "generic" | "rate_limited" | "rate_limited_retrying" | "rate_limited_after_results"

/**
 * `retrying` : relance demandée depuis le bloc du 429 et pas encore terminée. Sans données, la
 * requête relancée repasse en pending et perd son erreur : seul le clic permet de garder le bloc.
 */
export function searchResultsErrorDisplay(
  result: { isError: boolean; isFetching: boolean; error: unknown; data?: { pages: { hits?: unknown[] }[] } },
  { retrying = false }: { retrying?: boolean } = {}
): SearchResultsErrorDisplay {
  if (retrying && result.isFetching) return "rate_limited_retrying"
  if (!result.isError) return "none"
  if (!isRateLimited(result.error)) return "generic"
  // Une requête en erreur le reste pendant sa relance : le message disparaît le temps du
  // chargement, pour qu'un nouveau 429 soit annoncé à nouveau.
  if (result.isFetching) return "none"
  return result.data?.pages.some((page) => Boolean(page.hits?.length)) ? "rate_limited_after_results" : "rate_limited"
}
