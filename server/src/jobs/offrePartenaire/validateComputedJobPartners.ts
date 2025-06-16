import { Transform, Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { AnyBulkWriteOperation, Filter } from "mongodb"
import jobsPartnersModel from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { notifyToSlack } from "../../common/utils/slackUtils"

const groupSize = 100
const zodModel = jobsPartnersModel.zod

type BulkOperation = AnyBulkWriteOperation<IComputedJobsPartners>

export const validateComputedJobPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>, shouldNotifySlack = true) => {
  logger.info("validation des computed_job_partners")

  const finalFilter: Filter<IComputedJobsPartners> = {
    $and: [{ business_error: null }, ...(addedMatchFilter ? [addedMatchFilter] : [])],
  }

  const toUpdateCount = await getDbCollection("computed_jobs_partners").countDocuments(finalFilter)
  logger.info(`${toUpdateCount} documents à traiter`)

  const counters = { total: 0, success: 0, error: 0 }
  const job = COMPUTED_ERROR_SOURCE.VALIDATION
  const cursor = getDbCollection("computed_jobs_partners").find(finalFilter).stream()

  let buffer: IComputedJobsPartners[] = []

  const groupStream = new Transform({
    objectMode: true,
    transform(doc, _encoding, callback) {
      buffer.push(doc)
      if (buffer.length >= groupSize) {
        this.push(buffer)
        buffer = []
      }
      callback()
    },
    flush(callback) {
      if (buffer.length > 0) {
        this.push(buffer)
      }
      callback()
    },
  })

  const validateStream = new Writable({
    objectMode: true,
    async write(documents: IComputedJobsPartners[], _encoding, callback) {
      counters.total += documents.length
      if (counters.total % 1000 === 0) logger.info(`processing document ${counters.total}`)

      const operations: BulkOperation[] = []

      for (const document of documents) {
        const { success: validated, error } = zodModel.safeParse(document)

        operations.push({
          updateOne: {
            filter: { _id: document._id },
            update: { $pull: { errors: { source: job } } },
          },
        })

        operations.push({
          updateOne: {
            filter: { _id: document._id },
            update: { $set: { validated } },
          },
        })

        if (error) {
          counters.error++
          operations.push({
            updateOne: {
              filter: { _id: document._id },
              update: {
                $push: {
                  errors: {
                    source: job,
                    error: JSON.stringify(error),
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

  await pipeline(cursor, groupStream, validateStream)

  logger.info(`validation terminé`, counters)

  if (shouldNotifySlack) {
    await notifyToSlack({
      subject: `computedJobPartners: validation des offres`,
      message: `validation terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`,
    })
  }
}
