import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const getEntrepriseEngagementFranceTravail = async (siret: string): Promise<boolean> => {
  // 2025-08-07 : locked on france-travail sources for now
  const reponse = await getDbCollection("referentiel_engagement_entreprise").findOne({
    siret,
    sources: { $in: [EntrepriseEngagementSources.FRANCE_TRAVAIL] },
    engagement: "handicap",
  })
  if (!reponse) return false
  return true
}

export const getEntrepriseHandiEngagement = async (siret: string) => {
  return getDbCollection("referentiel_engagement_entreprise").findOne({ siret, engagement: "handicap" })
}
