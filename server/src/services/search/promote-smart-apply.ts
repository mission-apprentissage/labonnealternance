import type { ISearchItem } from "shared/models/index"

import type { SearchMode } from "@/services/search/search.service"

const PROMOTED_SMART_APPLY_COUNT = 3

/**
 * Remonte en tête de la page 0 du mode emplois les 3 premières offres Smart Apply, dans l'ordre
 * du moteur ; le reste garde l'ordre du moteur (#5718). Réordonne sans ajouter ni retirer de hit,
 * hors requête et tri du moteur pour pouvoir être retiré par un revert.
 */
export function promoteSmartApplyHits<T extends Pick<ISearchItem, "smart_apply">>(hits: T[], { page, mode }: { page: number; mode: SearchMode }): T[] {
  if (page !== 0 || mode !== "emplois") return hits

  const promoted: T[] = []
  const others: T[] = []
  for (const hit of hits) {
    if (hit.smart_apply === true && promoted.length < PROMOTED_SMART_APPLY_COUNT) promoted.push(hit)
    else others.push(hit)
  }
  return [...promoted, ...others]
}
