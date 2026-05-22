import fs from "node:fs/promises"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { SIRET_REGEX } from "shared/constants/regex"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"
import { validateSIRET } from "shared/validators/siretValidator"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"

const HANDIMATCH_FT_CSV_PATH = "referentiel/engagementHandicap/siret_handimatch_ft.csv"

export const refreshReferentielEngagementFranceTravail = async () => {
  const filepath = getStaticFilePath(HANDIMATCH_FT_CSV_PATH)
  const content = (await fs.readFile(filepath)).toString()
  const parsedCsv = await parseCsvContent(content, { delimiter: "," })
  const data = parsedCsv as { SIRET: string }[]

  let processed = 0
  const errors: string[] = []
  const now = new Date()

  await asyncForEach(data, async (line) => {
    try {
      const { SIRET: siret } = line
      if (!validateSIRET(siret)) {
        throw new Error(`refreshReferentielEngagementFranceTravail: invalid SIRET format "${siret}"`)
      }
      await getDbCollection("referentiel_engagement_entreprise").updateOne(
        { siret },
        {
          $addToSet: { sources: EntrepriseEngagementSources.FRANCE_TRAVAIL },
          $set: { updated_at: now, engagement: "handicap" },
          $setOnInsert: { _id: new ObjectId(), created_at: now, siret },
        },
        { upsert: true }
      )
      processed++
    } catch (err) {
      logger.error("error when treating line", line)
      logger.error(err)
      errors.push(line.SIRET)
    }
  })

  logger.info(`refreshReferentielEngagementFranceTravail: ${processed} upserted, ${errors.length} errors`)
  if (errors.length) {
    logger.warn(`refreshReferentielEngagementFranceTravail: SIRETs in error: ${errors.join(", ")}`)
  }
}

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

export const refreshReferentielEtEntrepriseEngagement = async () => {
  logger.info("Starting refreshReferentielEtEntrepriseEngagement")
  await refreshReferentielEngagementFranceTravail()
  await refreshEntrepriseEngagementJobsPartners()
  logger.info("Finished refreshReferentielEtEntrepriseEngagement")
}
