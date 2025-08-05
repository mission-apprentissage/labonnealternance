import { getDbCollection } from "@/common/utils/mongodbUtils"

export const getEntrepriseEngagement = async (siret: string): Promise<boolean> => {
  const reponse = await getDbCollection("referentiel_engagement_entreprise").findOne({ siret })
  if (!reponse) return false
  return true
}
