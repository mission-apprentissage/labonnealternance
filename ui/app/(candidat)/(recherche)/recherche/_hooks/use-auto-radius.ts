import { useEffect } from "react"
import { AUTO_RADIUS_MAX, AUTO_RADIUS_STEP, isAutoRadiusWidening } from "shared/utils/auto-radius"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import type { useSearchResults } from "./use-search-results"

export const nextAutoRadius = (radius: number) => Math.min(radius + AUTO_RADIUS_STEP, AUTO_RADIUS_MAX)

/** Paliers enchaînés depuis la dernière recherche lancée par l'usager. `searchKey` : clé du dernier palier. */
export type AutoRadiusChain = { searchKey: string; initialRadius: number; steps: number }

/**
 * Chaîne après un palier `from` → `toKey` : prolongée si `from` en est le dernier palier, sinon une
 * nouvelle. Idempotente : useAutoRadius redemande le même palier à chaque rendu tant que l'URL n'a
 * pas suivi.
 */
export function extendAutoRadiusChain(chain: AutoRadiusChain | null, from: { searchKey: string; radius: number }, toKey: string): AutoRadiusChain {
  if (chain?.searchKey === toKey) return chain
  const ongoing = chain?.searchKey === from.searchKey ? chain : null
  return { searchKey: toKey, initialRadius: ongoing?.initialRadius ?? from.radius, steps: (ongoing?.steps ?? 0) + 1 }
}

/** Dimensions auto_radius_steps / initial_radius de search_results_displayed pour la recherche affichée. */
export function autoRadiusTracking(chain: AutoRadiusChain | null, searchKey: string, radius: number) {
  if (chain?.searchKey === searchKey) return { auto_radius_steps: chain.steps, initial_radius: chain.initialRadius }
  return { auto_radius_steps: 0, initial_radius: radius }
}

/**
 * Élargit automatiquement le rayon par paliers de 20 km (20, 40, … jusqu'à 100) tant que la
 * recherche géolocalisée ne renvoie aucun résultat (cf. isAutoRadiusWidening).
 */
export function useAutoRadius({
  params,
  result,
  onRadiusChange,
}: {
  params: ISearchPageParams
  result: ReturnType<typeof useSearchResults>
  onRadiusChange: (radius: number) => void
}) {
  const nbHits = result.data?.pages.at(-1)?.nbHits ?? 0
  const busy = result.isLoading || result.isFetching
  const widening = isAutoRadiusWidening(params, nbHits)

  useEffect(() => {
    if (busy || !result.data) return
    if (widening) onRadiusChange(nextAutoRadius(params.radius))
  }, [widening, busy, result.data, params.radius, onRadiusChange])
}
