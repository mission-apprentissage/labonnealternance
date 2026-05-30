import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"
import type { AnyBulkWriteOperation } from "mongodb"
import { ObjectId } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { groupStreamData } from "@/common/utils/streamUtils"

const BULK_GROUP_SIZE = 1000

type RecruiterJobUpdate = Pick<
  IJobsPartnersOfferPrivate,
  "_id" | "establishment_id" | "relance_mail_expiration_J7" | "relance_mail_expiration_J1" | "offer_rome_appellation" | "mer_sent"
> & {
  managed_by?: string
}

export const up = async () => {
  const counters = { total: 0, updated: 0, unmatched: 0 }

  const updateDocumentsStream = getDbCollection("recruiters")
    .aggregate<RecruiterJobUpdate>(
      [
        {
          $unwind: "$jobs",
        },
        {
          $project: {
            _id: "$jobs._id",
            managed_by: "$managed_by",
            establishment_id: 1,
            relance_mail_expiration_J7: "$jobs.relance_mail_expiration_J7",
            relance_mail_expiration_J1: "$jobs.relance_mail_expiration_J1",
            offer_rome_appellation: "$jobs.rome_appellation_label",
            mer_sent: "$jobs.mer_sent",
          },
        },
      ],
      { allowDiskUse: true }
    )
    .stream()

  const updateJobsPartners = new Writable({
    objectMode: true,
    async write(documents: RecruiterJobUpdate[], _encoding, callback) {
      if (documents.length === 0) {
        callback()
        return
      }

      counters.total += documents.length

      const operations: AnyBulkWriteOperation<IJobsPartnersOfferPrivate>[] = documents.map(
        ({ _id, managed_by, relance_mail_expiration_J1, relance_mail_expiration_J7, mer_sent, establishment_id, offer_rome_appellation }) => {
          if (!managed_by || !ObjectId.isValid(managed_by)) {
            logger.warn(`[migration:20260304120000-suppression-recruiters] document id=${_id} managed_by is not an ObjectId`)
          }
          return {
            updateOne: {
              filter: { _id },
              update: {
                $set: {
                  managed_by: managed_by && ObjectId.isValid(managed_by) ? new ObjectId(managed_by) : null,
                  establishment_id,
                  relance_mail_expiration_J7,
                  relance_mail_expiration_J1,
                  offer_rome_appellation,
                  mer_sent,
                },
              },
              upsert: false,
            },
          }
        }
      )

      const result = await getDbCollection("jobs_partners").bulkWrite(operations, { ordered: false })
      counters.updated += result.matchedCount

      const unmatchedInBatch = documents.length - result.matchedCount
      if (unmatchedInBatch > 0) {
        counters.unmatched += unmatchedInBatch
        logger.warn(`[migration:20260304120000-suppression-recruiters] ${unmatchedInBatch} document(s) from recruiters had no match in jobs_partners for this batch`)
      }

      if (counters.total % 10_000 === 0) {
        logger.info(`[migration:20260304120000-suppression-recruiters] processed=${counters.total}, updated=${counters.updated}, unmatched=${counters.unmatched}`)
      }

      callback()
    },
  })

  await pipeline(updateDocumentsStream, groupStreamData({ size: BULK_GROUP_SIZE }), updateJobsPartners)

  if (counters.unmatched > 0) {
    logger.warn(`[migration:20260304120000-suppression-recruiters] completed with unmatched documents: ${counters.unmatched}`)
  }

  logger.info(`[migration:20260304120000-suppression-recruiters] completed. total=${counters.total}, updated=${counters.updated}, unmatched=${counters.unmatched}`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
