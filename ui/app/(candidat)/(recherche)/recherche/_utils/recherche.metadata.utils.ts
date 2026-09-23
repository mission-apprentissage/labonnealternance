import type { Metadata } from "next"

import { buildRechercheMetadata } from "./recherche.metadata.utils_LEGACY"
import { IRechercheMode, parseRecherchePageParams } from "./recherche.route.utils"
import { buildSearchPageCanonical, buildSearchPageTitle, parseSearchPageParams } from "./search.params.utils"

/**
 * Métadonnées SEO de /recherche (nouveau moteur, schéma `q`), avec repli sur le moteur legacy.
 *
 * Les URL legacy indexées (`?job_name=…&romes=…`) sont la 2ᵉ source de trafic organique
 * (~213k clics/an, requêtes « alternance {métier} »). `parseSearchPageParamsWithLegacy` les
 * traduit vers `q` pour les résultats et le H1 (#5321), mais les métadonnées restent
 * volontairement hors de cette traduction (d'où `parseSearchPageParams` sans repli) : on
 * restaure le titre/description/canonical EXACTS de la page legacy, sans churn côté Google.
 * Le repli ne s'active que si `job_name` est renseigné.
 *
 * Noindex ciblé (#5034) : les pages sans métier réel (`/recherche` nue, `romes=` seul, `job_name`
 * vide) ne ressortent, d'après GSC, que sur des requêtes de MARQUE déjà servies par l'accueil.
 * `index:false, follow:true` consolide l'autorité sur l'accueil sans couper le maillage interne.
 * Règle pilotée par la structure d'URL (pas de `q` ET pas de `job_name` réel). Réversible :
 * retirer la directive ré-indexe en quelques semaines de re-crawl.
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

  // URL legacy à métier réel (`job_name`) : indexable, titre restauré.
  // `.trim()` : un `job_name` vide ou fait d'espaces produirait un titre générique (le consommateur le trim)
  // tout en échappant au noindex — on l'exclut donc de la branche « métier réel ».
  const legacyParams = parseRecherchePageParams(search, IRechercheMode.DEFAULT)
  if (legacyParams?.job_name?.trim()) {
    return buildRechercheMetadata(legacyParams, "default")
  }

  // Page sans intention propre (marque, redondante avec l'accueil) → noindex ciblé (#5034).
  return { title: buildSearchPageTitle(params), robots: NOINDEX_FOLLOW }
}
