import type { Metadata } from "next"

import { buildRechercheMetadata } from "./recherche.metadata.utils_LEGACY"
import { IRechercheMode, parseRecherchePageParams } from "./recherche.route.utils"
import { buildSearchPageCanonical, buildSearchPageTitle, parseSearchPageParams } from "./search.params.utils"

/**
 * Métadonnées SEO de /recherche (nouveau moteur, schéma `q`), avec repli sur le moteur legacy.
 *
 * Depuis la bascule du nouveau moteur (qui ne lit que `q`, plus `job_name`/`romes`), les URL
 * indexées par Google au format legacy (`?job_name=…&romes=…`) — 2ᵉ source de trafic organique
 * (~213k clics/an, requêtes « alternance {métier} ») — ne sont plus reconnues et servent toutes
 * le même `<title>` générique dupliqué en SSR, cassant le match titre↔requête qui portait le trafic.
 *
 * Depuis #5321, ces URL sont de nouveau comprises côté résultats et H1 : `parseSearchPageParamsWithLegacy`
 * traduit `job_name`/`lat`/`lon`/`diploma` vers le schéma `q`. Les MÉTADONNÉES restent volontairement à
 * l'écart de cette traduction — d'où l'appel à `parseSearchPageParams` SANS repli ci-dessous. La raison
 * n'est plus « en attendant » mais permanente : on restaure ici le titre/description/canonical métier
 * EXACTS que la page legacy produisait pour ces URL, donc zéro churn côté Google. Faire passer ces URL
 * par la branche `q` changerait leurs titres du jour au lendemain. Le repli ne s'active que si
 * `job_name` est renseigné.
 *
 * Noindex chirurgical (#5034) : les pages sans métier réel (`/recherche` nue, `romes=` seul, `job_name`
 * vide type `romes=K2101`) n'ont pas d'intention propre — GSC montre qu'elles ressortent quasi
 * exclusivement sur des requêtes de MARQUE (« la bonne alternance » + typos), déjà servies par l'accueil.
 * On les passe donc en `index:false, follow:true` pour consolider l'autorité sur l'accueil sans couper la
 * circulation du jus interne. Règle pilotée par la structure d'URL (pas de `q` ET pas de `job_name` réel),
 * qui isole exactement ces pages sans jamais toucher aux URL à `job_name` réel (~213k clics/an) ni au
 * nouveau moteur `q`. Réversible : retirer la directive ré-indexe en quelques semaines de re-crawl.
 */
const NOINDEX_FOLLOW: Metadata["robots"] = { index: false, follow: true }

export function buildRecherchePageMetadata(search: URLSearchParams): Metadata {
  const params = parseSearchPageParams(search)

  // Nouveau moteur `q` : vraie intention de recherche → indexable. Canonical auto-référent OBLIGATOIRE :
  // sans lui, la page hérite du canonical racine (`"./"` → `/recherche`) et serait dé-indexée avec la
  // page nue passée en noindex ci-dessous.
  if (params.q) {
    return { title: buildSearchPageTitle(params), alternates: { canonical: buildSearchPageCanonical(params) } }
  }

  // URL legacy à métier réel (`job_name`) : vraie intention, 2ᵉ source de trafic → indexable, titre restauré.
  // `.trim()` : un `job_name` vide ou fait d'espaces produirait un titre générique (le consommateur le trim)
  // tout en échappant au noindex — on l'exclut donc de la branche « métier réel ».
  const legacyParams = parseRecherchePageParams(search, IRechercheMode.DEFAULT)
  if (legacyParams?.job_name?.trim()) {
    return buildRechercheMetadata(legacyParams, "default")
  }

  // Page sans intention propre (marque, redondante avec l'accueil) → noindex ciblé (#5034).
  return { title: buildSearchPageTitle(params), robots: NOINDEX_FOLLOW }
}
