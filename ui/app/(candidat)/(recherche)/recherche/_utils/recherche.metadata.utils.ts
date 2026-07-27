import type { IRecherchePageParams } from "./recherche.route.utils"

export type IRechercheMetaKind = "default" | "emploi" | "formation"

const SUFFIX = " | La bonne alternance"

/**
 * Construit le title + meta description SEO d'une page de recherche.
 * Met le métier (et la ville) en tête du title et ajoute un CTA dans la description.
 * `kind` : "default" (offres + formations), "emploi" (offres d'emploi), "formation" (formations).
 */
export function buildRechercheMetadata(rechercheParams: Partial<IRecherchePageParams> | null, kind: IRechercheMetaKind): { title: string; description: string } {
  const jobName = rechercheParams?.job_name?.trim() || null
  const address = rechercheParams?.geo?.address?.trim() || null
  // Distingue 3 cas de géo : adresse libellée (" à Lyon") · géo sans libellé (recherche
  // par rayon lat/lon sans param `address` → aucun lieu ajouté) · aucune géo (" en France").
  const hasGeo = rechercheParams?.geo != null
  const lieuTitle = address ? ` à ${address}` : ""
  const lieuDesc = address ? ` à ${address}` : hasGeo ? "" : " en France"

  if (kind === "formation") {
    if (jobName) {
      return {
        title: `Formations en alternance ${jobName}${lieuTitle}${SUFFIX}`,
        description: `Toutes les formations en apprentissage ${jobName}${lieuDesc}. Comparez les programmes et postulez gratuitement sur le service public de l'alternance.`,
      }
    }
    return {
      title: `Formations en alternance${SUFFIX}`,
      description: "Trouvez votre formation en apprentissage près de chez vous. Comparez les programmes par métier et par ville, postulez gratuitement.",
    }
  }

  const isEmploi = kind === "emploi"
  const offreLabel = isEmploi ? "offres d'emploi" : "offres et formations"
  const descOffreLabel = isEmploi ? "offres d'emploi en alternance" : "offres et formations en alternance"

  if (jobName) {
    return {
      title: `Alternance ${jobName}${lieuTitle} : ${offreLabel}${SUFFIX}`,
      description: `Toutes les ${descOffreLabel} ${jobName}${lieuDesc}. Postulez gratuitement sur le service public de l'alternance.`,
    }
  }

  return {
    title: `${isEmploi ? "Offres d'emploi en alternance" : "Offres et formations en alternance"}${SUFFIX}`,
    description: isEmploi
      ? "Trouvez votre alternance parmi des milliers d'offres d'emploi près de chez vous. Filtrez par métier, ville et type de contrat, postulez gratuitement."
      : "Trouvez votre alternance parmi des milliers d'offres et de formations près de chez vous. Filtrez par métier, ville et type de contrat.",
  }
}
