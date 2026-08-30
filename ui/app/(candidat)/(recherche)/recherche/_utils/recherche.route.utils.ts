import type { ReadonlyURLSearchParams } from "next/navigation"
import { NIVEAUX_POUR_LBA } from "shared/constants/recruteur"
// Imports profonds plutôt que le barrel "shared" : ce module part dans le bundle de la home
// (via le registre PAGES de routes.utils). Ce n'est pas ce qui a sorti zod du first-load — le
// barrel est élaguable et `routes.utils` l'utilise encore ; c'est la suppression des usages de
// zod *au niveau valeur* (z.object/z.enum/buildEnum) qui l'a fait. Les imports profonds sont
// une ceinture de sécurité : ils rendent la chaîne insensible à un futur `sideEffects` élargi
// dans shared/package.json, qui rendrait shared/routes non élaguable.
import { MAX_SEARCH_ROMES_PRIVATE } from "shared/constants/search"
import { typedKeys } from "shared/utils/object-utils"

import { parseSearchUrlFromParam } from "shared/utils/search-url-compat"

import { parseSearchPageParams } from "./search.params.utils"

/**
 * Paramètres d'URL du moteur de recherche legacy (`?job_name=…&romes=…`).
 *
 * Le moteur legacy est décommissionné : ce module ne sert plus qu'à
 * - produire les métadonnées SEO des URL legacy encore indexées (repli `?job_name=`,
 *   cf. `recherche.metadata.utils`) ;
 * - construire des liens `/recherche` au format legacy depuis le registre PAGES
 *   (pages éditoriales, retour à la liste des fiches détail ouvertes hors moteur) ;
 * - alimenter le formulaire de recherche des fiches détail (job_name, geo, radius).
 */
export type IRecherchePageParams = {
  romes: string[]
  geo: { address: string | null; latitude: number; longitude: number } | null
  radius: number
  diploma: keyof typeof NIVEAUX_POUR_LBA | null
  job_name: string | null
  displayEntreprises: boolean
  displayFormations: boolean
  displayFilters: boolean
  opco: string | null
  rncp: string | null
  scrollToRecruteursLba: boolean | null
}

const normalizeRomes = (romes: string[]) => romes.slice(0, MAX_SEARCH_ROMES_PRIVATE)

export enum IRechercheMode {
  DEFAULT = "default",
  FORMATIONS_ONLY = "formations-only",
  JOBS_ONLY = "jobs-only",
}

export function buildRecherchePageParams(rechercheParams: Partial<IRecherchePageParams> | null, mode: IRechercheMode | null): string {
  if (rechercheParams === null) return ""
  const query = new URLSearchParams()

  if (rechercheParams?.romes?.length > 0) {
    query.set("romes", normalizeRomes(rechercheParams.romes).join(","))
  }

  if (rechercheParams.radius !== undefined) {
    query.set("radius", rechercheParams.radius.toString())
  }
  if (rechercheParams.geo) {
    const { latitude, longitude } = rechercheParams.geo
    if (latitude !== undefined) {
      query.set("lat", latitude.toString())
    }
    if (longitude !== undefined) {
      query.set("lon", longitude.toString())
    }
    if (rechercheParams.geo.address) {
      query.set("address", rechercheParams.geo.address)
    }
  }

  if (rechercheParams.diploma) {
    query.set("diploma", rechercheParams.diploma)
  }
  if (rechercheParams.job_name) {
    query.set("job_name", rechercheParams.job_name)
  }
  if (rechercheParams?.opco) {
    query.set("opco", rechercheParams.opco)
  }
  if (rechercheParams?.rncp) {
    query.set("rncp", rechercheParams.rncp)
  }

  // In mode formations-only & jobs-only theses params cannot be modified
  if (mode === IRechercheMode.DEFAULT) {
    if (rechercheParams.displayEntreprises === false) {
      query.set("displayEntreprises", "false")
    }
    if (rechercheParams.displayFormations === false) {
      query.set("displayFormations", "false")
    }
    if (rechercheParams.displayFilters === false) {
      query.set("displayFilters", "false")
    }
  }

  if (rechercheParams.scrollToRecruteursLba) {
    query.set("scrollToRecruteursLba", "true")
  }

  return query.toString()
}

export function parseRecherchePageParams(search: ReadonlyURLSearchParams | URLSearchParams | null, mode: IRechercheMode): IRecherchePageParams | null {
  if (search === null) {
    return null
  }

  const romes = normalizeRomes(search.get("romes")?.split(",") ?? [])

  const rawLat = search.get("lat")
  const rawLon = search.get("lon")

  const geo =
    rawLat && rawLon
      ? {
          address: search.get("address") ?? null,
          latitude: parseFloat(rawLat),
          longitude: parseFloat(rawLon),
        }
      : null

  const radius = parseInt(search.get("radius") ?? "30", 10)
  const diploma = typedKeys(NIVEAUX_POUR_LBA).find((x) => x === search.get("diploma")) || null
  const job_name = search.get("job_name") || null

  const opco = search.get("opco") || null
  const rncp = search.get("rncp") || null

  const scrollToRecruteursLba = search.get("scrollToRecruteursLba") === "true"

  const commonProps = {
    romes,
    geo,
    diploma,
    job_name,
    opco,
    rncp,
    radius,
    scrollToRecruteursLba,
  } satisfies Partial<IRecherchePageParams>

  if (mode === IRechercheMode.FORMATIONS_ONLY) {
    return {
      ...commonProps,
      displayEntreprises: false,
      displayFormations: true,
      displayFilters: false,
    }
  }

  if (mode === IRechercheMode.JOBS_ONLY) {
    return {
      ...commonProps,
      displayEntreprises: true,
      displayFormations: false,
      displayFilters: false,
    }
  }

  const displayEntreprises = search.get("displayEntreprises") !== "false"
  const displayFormations = search.get("displayFormations") !== "false"
  const displayFilters = search.get("displayFilters") !== "false"

  return {
    ...commonProps,
    displayEntreprises,
    displayFormations,
    displayFilters,
  }
}

/**
 * Convertit les `searchParams` d'un Server Component en URLSearchParams sans perdre les
 * paramètres répétés. `new URLSearchParams(record)` les aplatit en une chaîne jointe par des
 * virgules (`?from=a&from=b` → `"a,b"`), ce qui fabrique une valeur qu'aucun des deux liens
 * ne portait — et que les gardes en aval valident alors comme une valeur unique.
 */
export function toURLSearchParams(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue
    for (const item of Array.isArray(value) ? value : [value]) search.append(key, item)
  }
  return search
}

/**
 * Contexte de recherche d'une fiche détail : le métier, le lieu et le rayon réellement
 * cherchés par l'usager. C'est ce que les fiches poussent dans `DisplayContext.formValues`,
 * et dont dépendent le `job_searched_by_user` enregistré avec chaque candidature (donc le bloc
 * « Sa recherche d'alternance » des mails recruteur et la variable `metier` des relances J+7),
 * l'affichage de la distance au lieu de recherche, et les dimensions métier/lieu des events
 * Plausible « Affichage - Fiche emploi » et Matomo.
 *
 * Deux formats d'entrée, par priorité :
 * 1. `?from=/recherche?q=…&latitude=…` — nouveau moteur. Les cartes de résultats ne posent plus
 *    `job_name`/`lat`/`lon` sur l'URL de la fiche : la recherche d'origine n'est portée que par
 *    l'URL de retour (cf. `buildHitDetailUrl`). C'est le seul format émis aujourd'hui.
 * 2. `?job_name=…&lat=…&lon=…&address=…` — format legacy, encore porté par les liens en
 *    circulation (pages éditoriales, liens partagés, résultats indexés).
 *
 * Un `?from=` valide fait autorité en bloc sur les trois champs : les deux formats décrivent la
 * même chose, les mélanger produirait un métier et un lieu venant de deux recherches
 * différentes. `?from=` externe ou malformé → repli legacy.
 *
 * Le garde du `from` n'est pas réimplémenté ici : `parseSearchUrlFromParam` (shared) le porte en
 * un seul exemplaire, partagé avec le hook de navigation et le serveur. Il rejette aussi bien les
 * préfixes voisins (`/recherche-formation`) que la remontée d'arborescence (`/recherche/../…`).
 */
export function resolveRecherchePageParams(search: URLSearchParams, mode: IRechercheMode): IRecherchePageParams {
  // Non nul par construction : `search` n'est jamais null ici, contrairement à la signature
  // large de parseRecherchePageParams (qui accepte le retour de useSearchParams).
  const legacyParams = parseRecherchePageParams(search, mode)
  if (legacyParams === null) throw new Error("resolveRecherchePageParams: searchParams manquants")

  // `from` répété (`?from=a&from=b`) : aucune des deux valeurs ne fait autorité, on ne devine
  // pas. Sans ce rejet, la première passerait le garde et la seconde finirait concaténée dans
  // le métier stocké avec la candidature.
  const fromValues = search.getAll("from")
  const fromSearch = fromValues.length === 1 ? parseSearchUrlFromParam(fromValues[0]) : null
  if (fromSearch === null) return legacyParams

  const { q, lieu_label, latitude, longitude, radius } = parseSearchPageParams(fromSearch)

  return {
    ...legacyParams,
    job_name: q ?? null,
    // parseSearchPageParams ne renvoie une coordonnée que si la paire est complète.
    geo: latitude !== undefined && longitude !== undefined ? { address: lieu_label ?? null, latitude, longitude } : null,
    radius,
  }
}
