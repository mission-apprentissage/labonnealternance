import { AnyBulkWriteOperation } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import jobsPartnersModel from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { streamGroupByCount } from "@/common/utils/streamUtils"

const groupSize = 100
const zodModel = jobsPartnersModel.zod

type BulkOperation = AnyBulkWriteOperation<IComputedJobsPartners>

export const validateComputedJobPartners = async () => {
  logger.info(`validation des computed_job_partners`)
  const toUpdateCount = await getDbCollection("computed_jobs_partners").countDocuments({})
  logger.info(`${toUpdateCount} documents à traiter`)
  const counters = { total: 0, success: 0, error: 0 }
  await oleoduc(
    getDbCollection("computed_jobs_partners").find({ business_error: null }).stream(),
    streamGroupByCount(groupSize),
    writeData(
      async (documents: IComputedJobsPartners[]) => {
        counters.total += documents.length
        counters.total % 1000 === 0 && logger.info(`processing document ${counters.total}`)
        const operations: BulkOperation[] = []
        documents.map((document) => {
          const { success: validated, error } = zodModel.safeParse(document)

          operations.push({
            updateOne: {
              filter: { _id: document._id },
              update: {
                $set: { validated },
              },
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
                      source: COMPUTED_ERROR_SOURCE.VALIDATION,
                      error: JSON.stringify(error),
                    },
                  },
                },
              },
            })
            operations.push({
              updateOne: {
                filter: { _id: document._id },
                update: {
                  $set: {
                    business_error: JOB_PARTNER_BUSINESS_ERROR.ZOD_VALIDATION,
                  },
                },
              },
            })
          } else {
            counters.success++
          }
        })
        if (operations?.length) {
          await getDbCollection("computed_jobs_partners").bulkWrite(operations, {
            ordered: false,
          })
        }
      },
      { parallel: 1 }
    )
  )
  logger.info(`validation terminé`, counters)
}
