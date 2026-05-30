import type { AnyBulkWriteOperation } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const BULK_SIZE = 500

export const resyncLbaJobsPartnersStats = async (): Promise<void> => {
  const recruitersCursor = getDbCollection("recruiters")
    .find(
      { "jobs.0": { $exists: true } },
      {
        projection: {
          _id: 1,
          "jobs._id": 1,
          "jobs.stats_detail_view": 1,
          "jobs.stats_search_view": 1,
        },
      }
    )
    .batchSize(BULK_SIZE)

  let recruitersCount = 0
  let jobsCount = 0
  let syncedJobsCount = 0
  let bulkOperations: AnyBulkWriteOperation<IJobsPartnersOfferPrivate>[] = []

  const flushBulkOperations = async () => {
    if (bulkOperations.length === 0) {
      return
    }

    const result = await getDbCollection("jobs_partners").bulkWrite(bulkOperations, { ordered: false })
    syncedJobsCount += result.matchedCount
    bulkOperations = []
  }

  logger.info("resyncLbaJobsPartnersStats: start")

  for await (const recruiter of recruitersCursor) {
    recruitersCount += 1

    for (const job of recruiter.jobs ?? []) {
      jobsCount += 1
      bulkOperations.push({
        updateOne: {
          filter: {
            _id: job._id,
            partner_label: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
          },
          update: {
            $set: {
              stats_detail_view: job.stats_detail_view ?? 0,
              stats_search_view: job.stats_search_view ?? 0,
            },
          },
        },
      })

      if (bulkOperations.length >= BULK_SIZE) {
        await flushBulkOperations()
      }
    }
  }

  await flushBulkOperations()

  logger.info(`resyncLbaJobsPartnersStats: terminé (recruiters=${recruitersCount}, jobs=${jobsCount}, jobs_partners_synced=${syncedJobsCount})`)
}
