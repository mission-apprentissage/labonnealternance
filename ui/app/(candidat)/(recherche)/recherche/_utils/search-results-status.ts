import { pluralize } from "@/utils/strutils"

import type { EmploisFallbackCount } from "../_hooks/use-emplois-fallback-count"
import { RATE_LIMITED_MESSAGE, type SearchResultsErrorDisplay } from "./search-results-error"

/**
 * Requête en cours qui vide le compteur : tout sauf un « Voir plus » ordinaire, que la liste
 * annonce elle-même. Un « Voir plus » relancé après une erreur le vide aussi, pour retirer le message.
 */
export function isResultsStatusWaiting({ isFetching, isFetchingNextPage, isError }: { isFetching: boolean; isFetchingNextPage: boolean; isError: boolean }): boolean {
  return isFetching && (!isFetchingNextPage || isError)
}

/**
 * Compteur annoncé par la zone role="status" de /recherche (RGAA 7.5). Vide tant qu'un résultat
 * reste à venir : requête en cours, palier d'élargissement du rayon, comptage en mode emplois.
 * Porte aussi l'annonce du 429, dont l'alerte n'a pas de rôle ; l'erreur générique garde le sien.
 */
export function searchResultsStatus({
  errorDisplay,
  hasData,
  waiting,
  nbHits,
  emploisFallback,
}: {
  errorDisplay: SearchResultsErrorDisplay
  hasData: boolean
  waiting: boolean
  nbHits: number
  emploisFallback: EmploisFallbackCount
}): string {
  if (errorDisplay === "rate_limited" || errorDisplay === "rate_limited_after_results") return RATE_LIMITED_MESSAGE
  if (!hasData || waiting || emploisFallback.status === "pending") return ""
  if (nbHits > 0) return pluralize(nbHits, "résultat")
  if (emploisFallback.status === "done" && emploisFallback.count > 0) {
    return `Aucun résultat. Le mode « Emplois uniquement » trouve ${pluralize(emploisFallback.count, "résultat")}`
  }
  return "Aucun résultat"
}
