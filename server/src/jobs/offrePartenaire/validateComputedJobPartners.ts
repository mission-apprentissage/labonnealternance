import { oleoduc, writeData } from "oleoduc"
import jobsPartnersModel from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { streamGroupByCount } from "@/common/utils/streamUtils"
import { isJobPartnerCompanyClosed } from "@/services/jobsPartner.service"

const groupSize = 100
const zodModel = jobsPartnersModel.zod

export const validateComputedJobPartners = async () => {
  logger.info(`validation des computed_job_partners`)
  const toUpdateCount = await getDbCollection("computed_jobs_partners").countDocuments({})
  logger.info(`${toUpdateCount} documents à traiter`)
  const counters = { total: 0, success: 0, error: 0 }
  await oleoduc(
    getDbCollection("computed_jobs_partners").find({}).stream(),
    streamGroupByCount(groupSize),
    writeData(
      async (documents: IComputedJobsPartners[]) => {
        counters.total += documents.length
        counters.total % 1000 === 0 && logger.info(`processing document ${counters.total}`)
        const bulkWriteFunction = getDbCollection("computed_jobs_partners").bulkWrite
        type Operation = Parameters<typeof bulkWriteFunction>[0][number]
        const setOperations: Operation[] = []
        const pushOperations: Operation[] = []
        documents.map((document) => {
          const { success, error } = zodModel.safeParse(document)
          const validated = !isJobPartnerCompanyClosed(document) && success

          setOperations.push({
            updateOne: {
              filter: { _id: document._id },
              update: {
                $set: { validated },
              },
            },
          })

          if (error) {
            counters.error++
            pushOperations.push({
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
          } else {
            if (validated) {
              counters.success++
            } else {
              counters.error++
            }
          }
        })
        if (setOperations?.length) {
          await getDbCollection("computed_jobs_partners").bulkWrite(setOperations, {
            ordered: false,
          })
        }
        if (pushOperations?.length) {
          await getDbCollection("computed_jobs_partners").bulkWrite(pushOperations, {
            ordered: false,
          })
        }
      },
      { parallel: 1 }
    )
  )
  logger.info(`validation terminé`, counters)
}
