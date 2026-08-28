import fs from "node:fs/promises"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { SIRET_REGEX } from "shared/constants/regex"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { validateSIRET } from "shared/validators/siret-validator"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/async-utils"
import { parseCsvContent } from "@/common/utils/file-utils"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"

const HANDIMATCH_FT_CSV_PATH = "referentiel/engagement-handicap/siret_handimatch_ft.csv"

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
      logger.error({ err, line }, "error when treating line")
      errors.push(line.SIRET)
    }
  })

  logger.info(`refreshReferentielEngagementFranceTravail: ${processed} upserted, ${errors.length} errors`)
  if (errors.length) {
    logger.warn(`refreshReferentielEngagementFranceTravail: SIRETs in error: ${errors.join(", ")}`)
  }
}

const buildEngagementFranceTravailLookupStage = () => ({
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
})

/**
 * Passe à true les offres actives dont le siret est désormais présent dans le référentiel d'engagement
 * (source FRANCE_TRAVAIL) alors qu'elles n'étaient pas encore marquées éligibles.
 */
export const activateEntrepriseEngagementJobsPartners = async () => {
  const matchFilter = {
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    contract_is_disabled_elligible: false,
    workplace_siret: { $exists: true, $ne: null },
  }
  const toUpdateCount = await getDbCollection("jobs_partners").countDocuments(matchFilter)
  logger.info(`activateEntrepriseEngagementJobsPartners: ${toUpdateCount} documents à traiter`)

  await getDbCollection("jobs_partners")
    .aggregate([
      { $match: matchFilter },
      buildEngagementFranceTravailLookupStage(),
      { $match: { "_engagement_match.0": { $exists: true } } },
      {
        $set: {
          contract_is_disabled_elligible: true,
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

  logger.info("activateEntrepriseEngagementJobsPartners: terminé")
}

/**
 * Passe à false les offres actives dont le siret n'est plus présent dans le référentiel d'engagement
 * (source FRANCE_TRAVAIL) alors qu'elles étaient marquées éligibles.
 */
export const deactivateEntrepriseEngagementJobsPartners = async () => {
  const matchFilter = {
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    contract_is_disabled_elligible: true,
    workplace_siret: { $exists: true, $ne: null },
  }
  const toUpdateCount = await getDbCollection("jobs_partners").countDocuments(matchFilter)
  logger.info(`deactivateEntrepriseEngagementJobsPartners: ${toUpdateCount} documents à traiter`)

  await getDbCollection("jobs_partners")
    .aggregate([
      { $match: matchFilter },
      buildEngagementFranceTravailLookupStage(),
      { $match: { "_engagement_match.0": { $exists: false } } },
      {
        $set: {
          contract_is_disabled_elligible: false,
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

  logger.info("deactivateEntrepriseEngagementJobsPartners: terminé")
}

export const refreshEntrepriseEngagementJobsPartners = async () => {
  await activateEntrepriseEngagementJobsPartners()
  await deactivateEntrepriseEngagementJobsPartners()
}

export const refreshReferentielEtEntrepriseEngagement = async () => {
  logger.info("Starting refreshReferentielEtEntrepriseEngagement")
  await refreshReferentielEngagementFranceTravail()
  await refreshEntrepriseEngagementJobsPartners()
  logger.info("Finished refreshReferentielEtEntrepriseEngagement")
}
