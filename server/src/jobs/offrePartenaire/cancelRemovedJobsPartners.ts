import type { Filter } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

/**
 * Annule les offres jobs_partners absentes (ou expirées) du flux source correspondant.
 *
 * IMPORTANT : `matchFilter` est obligatoire et ne doit jamais être vide. Un filtre vide
 * annulerait toutes les offres actives tous partenaires confondus. Cette fonction n'est donc
 * pas exposée en CLI : passer par les sous-jobs dédiés (cancelRemovedJobsPartnersFlux,
 * cancelRemovedJobsPartnersRecruteursLba) qui encapsulent leur filtre respectif.
 */
export const cancelRemovedJobsPartners = async (matchFilter: Filter<IComputedJobsPartners>) => {
  logger.info("début de cancelRemovedJobsPartners")

  const matchStage = {
    $match: {
      $and: [matchFilter, { offer_status: JOB_STATUS_ENGLISH.ACTIVE }],
    },
  }
  const setStages = {
    $set: {
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
    },
  }
  const unsetStage = {
    $unset: "matched",
  }
  const mergeStage = {
    $merge: {
      into: "jobs_partners",
      on: "_id",
      whenMatched: "merge",
      whenNotMatched: "discard",
    },
  }

  const pipeline = [
    matchStage,
    {
      $lookup: {
        from: "computed_jobs_partners",
        let: { partnerLabel: "$partner_label", partnerJobId: "$partner_job_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$partner_label", "$$partnerLabel"] }, { $eq: ["$partner_job_id", "$$partnerJobId"] }],
              },
            },
          },
        ],
        as: "matched",
      },
    },
    {
      $match: {
        matched: { $size: 0 },
      },
    },
    setStages,
    {
      $set: {
        offer_status_history: {
          $concatArrays: [
            "$offer_status_history",
            [
              {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: `supprimée du flux source`,
                granted_by: "cancelRemovedJobsPartners",
              },
            ],
          ],
        },
      },
    },
    unsetStage,
    mergeStage,
  ]

  logger.info("suppression des offres absentes du flux")
  await getDbCollection("jobs_partners").aggregate(pipeline).toArray()

  const pipeline_expired = [
    matchStage,
    {
      $lookup: {
        from: "computed_jobs_partners",
        let: {
          partnerLabel: "$partner_label",
          partnerJobId: "$partner_job_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$partner_label", "$$partnerLabel"] }, { $eq: ["$partner_job_id", "$$partnerJobId"] }, { $ne: ["$business_error", null] }],
              },
            },
          },
        ],
        as: "matched",
      },
    },
    {
      $match: {
        matched: {
          $ne: [],
        },
      },
    },
    setStages,
    {
      $set: {
        offer_status_history: {
          $concatArrays: [
            "$offer_status_history",
            [
              {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: `offre expirée`,
                granted_by: "cancelRemovedJobsPartners",
              },
            ],
          ],
        },
      },
    },
    unsetStage,
    mergeStage,
  ]

  logger.info("suppression des offres expirées")
  await getDbCollection("jobs_partners").aggregate(pipeline_expired).toArray()

  logger.info("fin de cancelRemovedJobsPartners")
}
