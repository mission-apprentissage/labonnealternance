import { pluralize } from "@/utils/strutils"

import type { EmploisFallbackCount } from "../_hooks/use-emplois-fallback-count"

/**
 * Compteur annoncé par la zone role="status" de /recherche (RGAA 7.5). Vide tant qu'un résultat
 * reste à venir : requête en cours, palier d'élargissement du rayon, comptage en mode emplois.
 */
export function searchResultsStatus({
  hasData,
  waiting,
  nbHits,
  emploisFallback,
}: {
  hasData: boolean
  waiting: boolean
  nbHits: number
  emploisFallback: EmploisFallbackCount
}): string {
  if (!hasData || waiting || emploisFallback.status === "pending") return ""
  if (nbHits > 0) return pluralize(nbHits, "résultat")
  if (emploisFallback.status === "done" && emploisFallback.count > 0) {
    return `Aucun résultat. Le mode « Emplois uniquement » trouve ${pluralize(emploisFallback.count, "résultat")}`
  }
  return "Aucun résultat"
}
