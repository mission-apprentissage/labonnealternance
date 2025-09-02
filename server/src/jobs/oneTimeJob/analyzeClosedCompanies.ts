import { JOB_STATUS } from "shared"
import { RECRUITER_STATUS } from "shared/constants/recruteur"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const analyzeClosedCompanies = async (): Promise<void> => {
  console.info("start")
  const activeRecruiters = await getDbCollection("recruiters")
    .aggregate([
      {
        $match: {
          status: RECRUITER_STATUS.ACTIF,
          "jobs.job_status": JOB_STATUS.ACTIVE,
        },
      },
    ])
    .toArray()
  console.info("active recruiters", activeRecruiters.length)

  const results = await getDbCollection("recruiters")
    .aggregate([
      {
        $match: {
          status: RECRUITER_STATUS.ACTIF,
          "jobs.job_status": JOB_STATUS.ACTIVE,
        },
      },
      {
        $lookup: {
          from: "cache_siret",
          localField: "establishment_siret",
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
          establishment_siret: 1,
        },
      },
    ])
    .toArray()
  console.info("recruteurs avec problemes", results.length)
  const flatResults = results.map(({ establishment_siret, cache }) => ({ siret: establishment_siret, status: cache?.[0]?.data?.data?.etat_administratif }))
  console.info(flatResults)
}
