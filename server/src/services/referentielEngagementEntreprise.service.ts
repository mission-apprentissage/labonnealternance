import { getDbCollection } from "@/common/utils/mongodbUtils"

export const getEntrepriseEngagement = async (siret: string): Promise<boolean> => {
  // 2025-08-07 : locked on france-travail sources for now
  const reponse = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret, sources: { $in: ["france-travail"] } })
  if (!reponse) return false
  return true
}
