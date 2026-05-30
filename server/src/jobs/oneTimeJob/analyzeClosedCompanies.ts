import type { ICacheInfosSiret, IEntreprise } from "shared"
import { EntrepriseStatus, getLastStatusEvent } from "shared"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const analyzeClosedCompanies = async (): Promise<void> => {
  console.info("start analyzeClosedCompanies")
  const results = (await getDbCollection("entreprises")
    .aggregate([
      {
        $lookup: {
          from: "cache_siret",
          localField: "siret",
          foreignField: "siret",
          as: "cache",
        },
      },
      {
        $match: {
          "cache.data.data.etat_administratif": { $ne: "A" },
        },
      },
      {
        $project: {
          "cache.data.data.etat_administratif": 1,
          status: 1,
          siret: 1,
        },
      },
    ])
    .toArray()) as (IEntreprise & { cache: ICacheInfosSiret })[]
  console.info("recruteurs avec problemes", results.length)
  const flatResults = results
    .filter((entreprise) => getLastStatusEvent(entreprise.status)?.status === EntrepriseStatus.VALIDE)
    .map(({ siret, cache }) => ({ siret, status: cache?.[0]?.data?.data?.etat_administratif }))
  console.info(flatResults)
}
