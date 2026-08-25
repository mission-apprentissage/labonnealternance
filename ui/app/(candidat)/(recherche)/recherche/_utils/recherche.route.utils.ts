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
