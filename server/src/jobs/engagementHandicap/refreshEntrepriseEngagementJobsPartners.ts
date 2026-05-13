import { JOB_STATUS_ENGLISH } from "shared"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const refreshEntrepriseEngagementJobsPartners = async () => {
  const matchFilter = { offer_status: JOB_STATUS_ENGLISH.ACTIVE }
  const toUpdateCount = await getDbCollection("jobs_partners").countDocuments(matchFilter)
  logger.info(`refreshEntrepriseEngagementJobsPartners: ${toUpdateCount} documents à traiter`)

  await getDbCollection("jobs_partners")
    .aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "referentiel_engagement_entreprise",
          let: { siret: "$workplace_siret" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $ne: ["$$siret", null] }, { $eq: ["$siret", "$$siret"] }, { $in: [EntrepriseEngagementSources.FRANCE_TRAVAIL, "$sources"] }],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "_engagement_match",
        },
      },
      {
        $set: {
          contract_is_disabled_elligible: { $gt: [{ $size: "$_engagement_match" }, 0] },
          updated_at: "$$NOW",
        },
      },
      { $unset: "_engagement_match" },
      {
        $merge: {
          into: "jobs_partners",
          on: "_id",
          whenMatched: "merge",
          whenNotMatched: "discard",
        },
      },
    ])
    .toArray()

  logger.info("refreshEntrepriseEngagementJobsPartners: terminé")
}
