import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { jobPartnersByFlux } from "@/jobs/offrePartenaire/processJobPartners"

const GRANTED_BY = "20260618102545-cancel-jobs-partners-with-invalid-computed"

/**
 * Annule les offres jobs_partners publiées par erreur.
 *
 * Cible : les jobs_partners avec offer_status Active dont le computed_jobs_partners
 * correspondant (même partner_label + partner_job_id) existe avec validated = false.
 * Ces offres ont été importées avant que le pipeline de blocage (ex: CFA blacklist)
 * n'ait eu l'occasion de tourner, ou via processMissingRomeAndImportToJobPartners
 * qui ne vérifie pas les règles métier.
 */
export const up = async () => {
  const now = new Date()
  const BATCH_SIZE = 500

  const cursor = getDbCollection("jobs_partners").aggregate<{ _id: ObjectId }>([
    { $match: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, partner_label: { $in: jobPartnersByFlux } } },
    {
      $lookup: {
        from: "computed_jobs_partners",
        let: { pl: "$partner_label", pjid: "$partner_job_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$partner_label", "$$pl"] }, { $eq: ["$partner_job_id", "$$pjid"] }, { $eq: ["$validated", false] }, { $ne: ["$business_error", null] }],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: "invalid_computed",
      },
    },
    { $match: { "invalid_computed.0": { $exists: true } } },
    { $project: { _id: 1 } },
  ])

  let batch: ObjectId[] = []
  let totalModified = 0

  const flush = async () => {
    if (batch.length === 0) return
    const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
      { _id: { $in: batch } },
      {
        $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE },
        $push: {
          offer_status_history: {
            date: now,
            status: JOB_STATUS_ENGLISH.ANNULEE,
            reason: "annulation suite à publication erronée",
            granted_by: GRANTED_BY,
          },
        },
      }
    )
    totalModified += modifiedCount
    batch = []
  }

  for await (const { _id } of cursor) {
    batch.push(_id)
    if (batch.length >= BATCH_SIZE) {
      await flush()
    }
  }
  await flush()

  logger.info(`cancel invalid jobs_partners : ${totalModified} offres annulées`)
}

export const requireShutdown: boolean = false
