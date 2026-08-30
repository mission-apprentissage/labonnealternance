import { applyLegacySearchParams, resolveSearchParamsFromUrl } from "shared/utils/search-url-compat"

import type { ISearchPageParams } from "./search.params.utils"
import { buildSearchUrl, parseSearchPageParams } from "./search.params.utils"

/**
 * Lecture des paramètres de `/recherche` en acceptant AUSSI le format legacy
 * (`?job_name=…&romes=…&lat=…&lon=…`).
 *
 * Volontairement hors de `search.params.utils` : ce module part dans le bundle de `/recherche`,
 * pas dans celui de la home, et `buildRecherchePageMetadata` doit continuer d'appeler
 * `parseSearchPageParams` SANS repli — sa branche legacy restitue les `<title>`/canonical exacts
 * de l'ancien moteur pour les URL indexées (2ᵉ source de trafic organique) et tout changement de
 * titre y serait un churn SEO, pas une correction.
 *
 * L'URL n'est pas réécrite au chargement : la première interaction (filtre, tri, pagination)
 * repasse par `buildSearchUrl` et la normalise d'elle-même.
 */
export function parseSearchPageParamsWithLegacy(search: URLSearchParams): ISearchPageParams {
  return parseSearchPageParams(applyLegacySearchParams(search))
}

/**
 * URL de recherche « entreprises à contacter » à proposer depuis une fiche détail, pour les CTA
 * de candidature spontanée. Renvoie `null` quand la page n'a aucun contexte de recherche à
 * rejouer — les CTA se désactivent alors plutôt que d'envoyer sur une page de résultats nue.
 *
 * Couvre les deux formes d'arrivée : le `?from=` posé par les cartes du nouveau moteur, et les
 * URL legacy encore en circulation (emails déjà partis, favoris, liens indexés).
 */
export function buildRecruteursLbaSearchUrl(currentUrl: string): string | null {
  let params: URLSearchParams | null
  try {
    params = resolveSearchParamsFromUrl(new URL(currentUrl))
  } catch {
    return null
  }
  if (params === null) return null

  return buildSearchUrl({ ...parseSearchPageParams(params), is_algo_company: [true] })
}
