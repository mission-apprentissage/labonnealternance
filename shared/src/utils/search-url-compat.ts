import { NIVEAUX_POUR_LBA } from "../constants/recruteur.js"

/**
 * Traduction des paramètres d'URL du moteur de recherche legacy (`?job_name=…&romes=…&lat=…`)
 * vers ceux du nouveau moteur (`?q=…&latitude=…`).
 *
 * Pourquoi ce module existe : le nouveau moteur ne lit QUE son propre schéma
 * (`parseSearchPageParams`). Toute URL au format legacy — email déjà parti, lien indexé par
 * Google, favori, lien posé par un site tiers, `application_url` historique en base — atterrit
 * donc sur une page de résultats vide de tout filtre, sans erreur ni signal. Ces URL ne sont pas
 * modifiables rétroactivement : la compatibilité doit être portée par le code qui les reçoit.
 *
 * Partagé `ui` / `server` volontairement : la table de correspondance est la même des deux côtés
 * (page `/recherche` d'un côté, liens de relance et d'accusé de candidature de l'autre), et une
 * seconde copie divergerait au premier ajout de filtre.
 *
 * Correspondances :
 * | legacy                     | nouveau moteur          | note                                        |
 * | `job_name`                 | `q`                     | libellé métier saisi par l'usager           |
 * | `address`                  | `lieu_label`            |                                             |
 * | `lat` + `lon`              | `latitude` + `longitude`| paire obligatoire (une seule = inutilisable)|
 * | `radius`                   | `radius`                | même nom, même unité (km)                   |
 * | `diploma`                  | `level`                 | via NIVEAUX_POUR_LBA, `INDIFFERENT` ignoré  |
 * | `displayFormations=true`   | `mode=emplois_formation`|                                             |
 * | `displayEntreprises=false` | `is_algo_company=false` | masquait les recruteurs LBA                 |
 * | `scrollToRecruteursLba`    | `is_algo_company=true`  | mise en avant des entreprises à contacter   |
 * | `romes`, `rncp`, `opco`    | —                       | pas d'équivalent (cf. NON_TRADUITS)         |
 * | `displayFilters`, `activeItems` | —                  | notions disparues du nouveau moteur         |
 *
 * `romes` n'est PAS traduit : le nouveau moteur cherche sur un libellé texte (`q`), pas sur des
 * codes ROME, et résoudre code → libellé demande le référentiel ROME (indisponible côté front).
 * Les URL legacy portant un métier réel portent toujours `job_name` à côté de `romes` — c'est
 * cette clé-là qui porte l'intention.
 */

/** Clés legacy sans équivalent : consommées puis abandonnées, listées pour l'audit. */
const LEGACY_PARAMS_SANS_EQUIVALENT = ["romes", "rncp", "opco", "displayFilters", "activeItems"] as const

/** Clés legacy traduites ci-dessous. */
const LEGACY_PARAMS_TRADUITS = ["job_name", "address", "lat", "lon", "diploma", "displayFormations", "displayEntreprises", "scrollToRecruteursLba"] as const

const isSet = (params: URLSearchParams, key: string) => (params.get(key) ?? "").trim() !== ""

/**
 * Complète `search` avec la traduction de ses paramètres legacy. Les paramètres déjà exprimés
 * dans le schéma du nouveau moteur PRIMENT (une URL mixte — `/recherche-formation?job_name=…`
 * après la redirection `next.config.mjs` qui pose `mode=formations` — ne doit pas voir son
 * `mode` écrasé par l'inférence legacy).
 *
 * Les paramètres inconnus (`utm_*`, `caller`, `from`…) sont recopiés : ils portent l'attribution
 * de campagne et le contexte widget, que ce module n'a pas à décider de jeter.
 */
export function applyLegacySearchParams(search: URLSearchParams): URLSearchParams {
  const result = new URLSearchParams()

  const dropped = new Set<string>([...LEGACY_PARAMS_SANS_EQUIVALENT, ...LEGACY_PARAMS_TRADUITS])
  for (const [key, value] of search.entries()) {
    if (!dropped.has(key)) result.append(key, value)
  }

  if (!isSet(result, "q") && isSet(search, "job_name")) {
    result.set("q", search.get("job_name")!.trim())
  }

  if (!isSet(result, "lieu_label") && isSet(search, "address")) {
    result.set("lieu_label", search.get("address")!)
  }

  // Une coordonnée sans l'autre est inutilisable côté moteur (la paire est exigée) : on ne
  // traduit que si les deux sont exploitables, sinon on ne pose rien plutôt qu'un `latitude` seul.
  if (!isSet(result, "latitude") && !isSet(result, "longitude")) {
    const lat = Number.parseFloat(search.get("lat") ?? "")
    const lon = Number.parseFloat(search.get("lon") ?? "")
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      result.set("latitude", lat.toString())
      result.set("longitude", lon.toString())
    }
  }

  if (!isSet(result, "level")) {
    const diploma = search.get("diploma")
    const level = diploma && diploma !== "INDIFFERENT" ? NIVEAUX_POUR_LBA[diploma as keyof typeof NIVEAUX_POUR_LBA] : undefined
    if (level) result.set("level", level)
  }

  // `mode` n'est inféré que si le lien exprimait explicitement un choix d'affichage. Une URL
  // legacy nue (ni `displayFormations` ni `displayEntreprises`) reste sur le défaut du nouveau
  // moteur (`emplois`) : c'est déjà ce qu'elle produit aujourd'hui, et basculer ces URL — dont
  // les pages métier indexées, 2ᵉ source de trafic organique — en emplois+formations serait un
  // changement de mix de résultats, pas une correction de lien.
  if (!isSet(result, "mode") && search.get("displayFormations") === "true") {
    result.set("mode", "emplois_formation")
  }

  if (!result.has("is_algo_company")) {
    if (search.get("scrollToRecruteursLba") === "true") {
      result.set("is_algo_company", "true")
    } else if (search.get("displayEntreprises") === "false") {
      result.set("is_algo_company", "false")
    }
  }

  return result
}

/**
 * `true` si l'URL traduite désigne une recherche réellement exploitable : un métier, ou à défaut
 * un lieu. Sans l'un des deux, le lien ne vaut pas mieux que la page de résultats nue — les
 * appelants (relances email) préfèrent alors ne pas poser de lien du tout.
 */
export function hasExploitableSearch(search: URLSearchParams): boolean {
  return isSet(search, "q") || (isSet(search, "latitude") && isSet(search, "longitude"))
}

/** Chemin de la page de résultats du nouveau moteur. */
export const SEARCH_PAGE_PATH = "/recherche"

/**
 * Seul garde du paramètre `from` posé par les cartes de résultats sur les URL de fiche détail
 * (`/emploi/…?from=%2Frecherche%3Fq%3D…`) : seule la page de résultats elle-même est acceptée.
 * `from` finit dans une navigation — c'est ce garde qui empêche une redirection arbitraire via
 * un lien forgé, et il ne doit donc exister qu'en un seul exemplaire (cf. `getSearchUrlFromParam`,
 * qui en dérive côté fiches détail).
 *
 * Le chemin doit être `/recherche` EXACTEMENT, éventuellement suivi de sa query ou de son ancre.
 * Un simple `startsWith` laisserait passer deux familles de chemins qui ne sont pas la page de
 * résultats : les préfixes voisins (`/recherche-formation?job_name=…`, dont la query legacy serait
 * alors lue comme si elle était au nouveau format) et la remontée d'arborescence
 * (`/recherche/../…`, que le routeur normalise vers un chemin interne quelconque).
 */
export function isInternalSearchUrl(from: string | null | undefined): from is string {
  if (typeof from !== "string" || !from.startsWith(SEARCH_PAGE_PATH)) return false
  const nextChar = from[SEARCH_PAGE_PATH.length]
  return nextChar === undefined || nextChar === "?" || nextChar === "#"
}

/** Query du `from` validé, au format du nouveau moteur. `null` si le `from` est rejeté. */
export function parseSearchUrlFromParam(from: string | null | undefined): URLSearchParams | null {
  if (!isInternalSearchUrl(from)) return null
  return new URLSearchParams(from.split("?")[1] ?? "")
}

/**
 * Recherche portée par une URL LBA quelconque — page de résultats (nouveau moteur ou legacy) ou
 * fiche détail ouverte depuis les résultats. Renvoie `null` quand il n'y a aucune recherche
 * exploitable à rejouer.
 *
 * Ordre : `from` d'abord (déjà au format du nouveau moteur, c'est la recherche exacte de
 * l'usager), traduction legacy ensuite (URL d'avant la bascule).
 */
export function resolveSearchParamsFromUrl(url: URL): URLSearchParams | null {
  const fromParams = parseSearchUrlFromParam(url.searchParams.get("from"))
  const params = fromParams ?? applyLegacySearchParams(url.searchParams)
  return hasExploitableSearch(params) ? params : null
}
