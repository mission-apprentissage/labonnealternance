import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { AnyBulkWriteOperation, Filter } from "mongodb"
import jobsPartnersModel from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { groupStreamData } from "@/common/utils/streamUtils"
import { FillComputedJobsPartnersContext } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

import { notifyToSlack } from "../../common/utils/slackUtils"

const groupSize = 500
const zodModel = jobsPartnersModel.zod

type BulkOperation = AnyBulkWriteOperation<IComputedJobsPartners>

export const validateComputedJobPartners = async ({ addedMatchFilter, shouldNotifySlack }: FillComputedJobsPartnersContext) => {
  logger.info("validation des computed_job_partners")

  const finalFilter: Filter<IComputedJobsPartners> = {
    $and: [{ business_error: null }, ...(addedMatchFilter ? [addedMatchFilter] : [])],
  }

  const toUpdateCount = await getDbCollection("computed_jobs_partners").countDocuments(finalFilter)
  logger.info(`${toUpdateCount} documents à traiter`)

  const counters = { total: 0, success: 0, error: 0 }
  const job = COMPUTED_ERROR_SOURCE.VALIDATION
  const cursor = getDbCollection("computed_jobs_partners").find(finalFilter).stream()

  const validateStream = new Writable({
    objectMode: true,
    async write(documents: IComputedJobsPartners[], _encoding, callback) {
      counters.total += documents.length
      if (counters.total % 10_000 === 0) logger.info(`processing document ${counters.total}`)

      const operations: BulkOperation[] = []

      for (const document of documents) {
        const { success: validated, error } = zodModel.safeParse(document)
        let finalError: any = error
        let finalValidated = validated
        if (finalValidated && !document.offer_rome_codes?.length) {
          finalValidated = false
          finalError = "offer_rome_codes is empty"
        }

        operations.push({
          updateOne: {
            filter: { _id: document._id },
            update: { $pull: { errors: { source: job } } },
          },
        })

        operations.push({
          updateOne: {
            filter: { _id: document._id },
            update: { $set: { validated: finalValidated } },
          },
        })

        if (finalError) {
          counters.error++
          operations.push({
            updateOne: {
              filter: { _id: document._id },
              update: {
                $push: {
                  errors: {
                    source: job,
                    error: JSON.stringify(finalError),
                  },
                },
              },
            },
          })
        } else {
          counters.success++
        }
      }

      if (operations.length > 0) {
        await getDbCollection("computed_jobs_partners").bulkWrite(operations, { ordered: true })
      }

      callback()
    },
  })

  await pipeline(cursor, groupStreamData({ size: groupSize }), validateStream)

  logger.info(`validation terminé`, counters)

  if (shouldNotifySlack) {
    await notifyToSlack({
      subject: `computedJobPartners: validation des offres`,
      message: `validation terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`,
    })
  }
}
