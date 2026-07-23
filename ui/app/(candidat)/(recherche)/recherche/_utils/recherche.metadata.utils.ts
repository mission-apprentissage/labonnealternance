import type { Metadata } from "next"

import type { IRecherchePageParams } from "./recherche.route.utils"

export type IRechercheMetaKind = "default" | "emploi" | "formation"

const SUFFIX = " | La bonne alternance"

const BASE_PATH_BY_KIND: Record<IRechercheMetaKind, string> = {
  default: "/recherche",
  emploi: "/recherche-emploi",
  formation: "/recherche-formation",
}

/**
 * Construit un canonical stable pour une page de recherche : chemin du mode + uniquement les
 * paramètres qui définissent une recherche distincte et indexable (`romes`, `job_name`, et
 * l'`address` quand une ville est renseignée — les SERP géolocalisées ont leur propre trafic).
 * Exclut tout le bruit d'URL : `s` (timestamp), `lat`/`lon`, `display`, `page`/`itemId`,
 * `activeItems`, toggles UI, `utm_*`.
 */
function buildRechercheCanonical(rechercheParams: Partial<IRecherchePageParams> | null, kind: IRechercheMetaKind): string {
  const basePath = BASE_PATH_BY_KIND[kind]
  const params = new URLSearchParams()
  const romes = rechercheParams?.romes
  const hasRomes = Boolean(romes && romes.length > 0)
  if (hasRomes) {
    params.set("romes", romes!.join(","))
  }
  const jobName = rechercheParams?.job_name?.trim()
  if (jobName) {
    params.set("job_name", jobName)
  }
  // Géo incluse uniquement pour une recherche métier + ville, ET avec lat/lon : le parseur de
  // recherche ne reconstruit la géo que si lat ET lon sont présents (address seule est ignorée),
  // donc un canonical à `address` seule pointerait vers une page non géolocalisée (chaîne incohérente).
  // Une recherche ville seule est volontairement consolidée (les pages /alternance/ville/* la couvrent).
  const geo = rechercheParams?.geo
  const address = geo?.address?.trim()
  const hasMetier = Boolean(jobName) || hasRomes
  if (hasMetier && geo && address) {
    params.set("lat", String(geo.latitude))
    params.set("lon", String(geo.longitude))
    params.set("address", address)
  }
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

/**
 * Construit le title + meta description + canonical SEO d'une page de recherche.
 * Met le métier (et la ville) en tête du title et ajoute un CTA dans la description.
 * `kind` : "default" (offres + formations), "emploi" (offres d'emploi), "formation" (formations).
 */
export function buildRechercheMetadata(rechercheParams: Partial<IRecherchePageParams> | null, kind: IRechercheMetaKind): Metadata {
  const jobName = rechercheParams?.job_name?.trim() || null
  const address = rechercheParams?.geo?.address?.trim() || null
  // Distingue 3 cas de géo : adresse libellée (" à Lyon") · géo sans libellé (recherche
  // par rayon lat/lon sans param `address` → aucun lieu ajouté) · aucune géo (" en France").
  const hasGeo = rechercheParams?.geo != null
  const lieuTitle = address ? ` à ${address}` : ""
  const lieuDesc = address ? ` à ${address}` : hasGeo ? "" : " en France"

  const alternates = { canonical: buildRechercheCanonical(rechercheParams, kind) }

  let title: string
  let description: string

  if (kind === "formation") {
    if (jobName) {
      title = `Formations en alternance ${jobName}${lieuTitle}${SUFFIX}`
      description = `Toutes les formations en apprentissage ${jobName}${lieuDesc}. Comparez les programmes et postulez gratuitement sur le service public de l'alternance.`
    } else {
      title = `Formations en alternance${SUFFIX}`
      description = "Trouvez votre formation en apprentissage près de chez vous. Comparez les programmes par métier et par ville, postulez gratuitement."
    }
    return { title, description, alternates }
  }

  const isEmploi = kind === "emploi"
  const offreLabel = isEmploi ? "offres d'emploi" : "offres et formations"
  const descOffreLabel = isEmploi ? "offres d'emploi en alternance" : "offres et formations en alternance"

  if (jobName) {
    title = `Alternance ${jobName}${lieuTitle} : ${offreLabel}${SUFFIX}`
    description = `Toutes les ${descOffreLabel} ${jobName}${lieuDesc}. Postulez gratuitement sur le service public de l'alternance.`
  } else {
    title = `${isEmploi ? "Offres d'emploi en alternance" : "Offres et formations en alternance"}${SUFFIX}`
    description = isEmploi
      ? "Trouvez votre alternance parmi des milliers d'offres d'emploi près de chez vous. Filtrez par métier, ville et type de contrat, postulez gratuitement."
      : "Trouvez votre alternance parmi des milliers d'offres et de formations près de chez vous. Filtrez par métier, ville et type de contrat."
  }

  return { title, description, alternates }
}
