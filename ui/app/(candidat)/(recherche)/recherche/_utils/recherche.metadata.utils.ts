import type { Metadata } from "next"

import { buildRechercheMetadata } from "./recherche.metadata.utils_LEGACY"
import { IRechercheMode, parseRecherchePageParams } from "./recherche.route.utils"
import { buildSearchPageTitle, parseSearchPageParams } from "./search.params.utils"

/**
 * Métadonnées SEO de /recherche (nouveau moteur, schéma `q`), avec repli sur le moteur legacy.
 *
 * Depuis la bascule du nouveau moteur (qui ne lit que `q`, plus `job_name`/`romes`), les URL
 * indexées par Google au format legacy (`?job_name=…&romes=…`) — 2ᵉ source de trafic organique
 * (~213k clics/an, requêtes « alternance {métier} ») — ne sont plus reconnues et servent toutes
 * le même `<title>` générique dupliqué en SSR, cassant le match titre↔requête qui portait le trafic.
 *
 * Tant que le mapping complet legacy→`q` (résultats + H1 en SSR) n'est pas fait (#5033), on restaure
 * ici le titre/description/canonical métier EXACTS que la page legacy produisait pour ces URL — donc
 * zéro churn côté Google. Le repli ne s'active que si `job_name` est renseigné : les pages sans métier
 * (`/recherche` nue, `job_name` vide type `romes=K2101` servi à la marque) gardent le titre générique,
 * cohérent avec leur dé-indexation ciblée à venir (#5034).
 */
export function buildRecherchePageMetadata(search: URLSearchParams): Metadata {
  const params = parseSearchPageParams(search)

  if (!params.q) {
    const legacyParams = parseRecherchePageParams(search, IRechercheMode.DEFAULT)
    if (legacyParams?.job_name) {
      return buildRechercheMetadata(legacyParams, "default")
    }
  }

  return { title: buildSearchPageTitle(params) }
}
