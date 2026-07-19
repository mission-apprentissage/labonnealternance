import { useEffect } from "react"
import type { ISearchPageParams } from "../_utils/search.params.utils"
import type { useSearchResults } from "./useSearchResults"

const RADIUS_STEP = 20
export const RADIUS_MAX = 100

/**
 * Élargit automatiquement le rayon par paliers de 20 km (20, 40, … jusqu'à 100)
 * tant que la recherche géolocalisée ne renvoie aucun résultat. Remplace le
 * champ rayon manuel (devenu inutile sans carte, le scroll infini chargeant la
 * suite). Ne s'active que si un lieu (lat/lng) est défini.
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
  const hasGeo = params.latitude !== undefined && params.longitude !== undefined
  const nbHits = result.data?.pages.at(-1)?.nbHits ?? 0
  const busy = result.isLoading || result.isFetching

  useEffect(() => {
    if (!hasGeo || busy) return
    if (!result.data) return
    if (nbHits === 0 && params.radius < RADIUS_MAX) {
      onRadiusChange(Math.min(params.radius + RADIUS_STEP, RADIUS_MAX))
    }
  }, [hasGeo, busy, result.data, nbHits, params.radius, onRadiusChange])
}
