import type { ISearchPageParams } from "./search.params.utils"

/**
 * Même recherche en mode « Emplois uniquement », proposée par l'état vide du mode « Emplois avec
 * formation incluse » (#5637). Sert au comptage ET à la navigation : le nombre annoncé est celui
 * qui s'affiche après le clic. Retire les filtres propres au corpus emplois_formation :
 * `type_filter_label` (« Offres d'emploi postées par des écoles ») et `organization_name` (un CFA
 * ou un GEIQ), ainsi que `is_algo_company`, masqué hors mode emplois. Le rayon est conservé : à
 * l'état vide, l'élargissement automatique est allé à son terme.
 */
export function emploisFallbackParams(params: ISearchPageParams): ISearchPageParams {
  return { ...params, mode: "emplois", type_filter_label: undefined, organization_name: undefined, is_algo_company: undefined, page: 0 }
}
