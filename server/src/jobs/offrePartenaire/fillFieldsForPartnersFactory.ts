import { internal } from "@hapi/boom"
import { Filter } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { entriesToTypedRecord } from "shared/utils"

import { logger as globalLogger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { streamGroupByCount } from "@/common/utils/streamUtils"

export const fillFieldsForPartnersFactory = async <SourceFields extends keyof IJobsPartnersOfferPrivate, FilledFields extends keyof IJobsPartnersOfferPrivate>({
  job,
  sourceFields,
  filledFields,
  getData,
  groupSize,
}: {
  job: COMPUTED_ERROR_SOURCE
  sourceFields: readonly SourceFields[]
  filledFields: readonly FilledFields[]
  getData: (sourceFields: Pick<IComputedJobsPartners, SourceFields>[]) => Promise<Array<Pick<IComputedJobsPartners, FilledFields> | undefined>>
  groupSize: number
}) => {
  const logger = globalLogger.child({
    job,
  })
  logger.info(`job ${job} : début d'enrichissement des données`)
  const queryFilter: Filter<IComputedJobsPartners> = {
    validated: false,
    ...Object.fromEntries(sourceFields.map((field) => [[field], { $ne: null }])),
    $or: filledFields.map((field) => ({ [field]: null })),
  }
  const toUpdateCount = await getDbCollection("computed_jobs_partners").countDocuments(queryFilter)
  logger.info(`${toUpdateCount} documents à traiter`)
  const counters = { total: 0, success: 0, error: 0 }
  await oleoduc(
    getDbCollection("computed_jobs_partners").find(queryFilter).stream(),
    streamGroupByCount(groupSize),
    writeData(
      async (documents: IComputedJobsPartners[]) => {
        counters.total += documents.length
        counters.total % 1000 === 0 && logger.info(`processing document ${counters.total}`)
        try {
          const responses = await getData(documents)

          const dataToWrite = documents.flatMap((document, index) => {
            const newFields = responses[index]
            if (!newFields) {
              return []
            }
            const entries = Object.entries(newFields) as [FilledFields, IComputedJobsPartners[FilledFields]][]
            const newFieldsUpdateOnlyEmpty = entriesToTypedRecord(
              entries.filter(([key, _value]) => {
                const oldValue = document[key]
                return oldValue === undefined || oldValue === null || oldValue === ""
              })
            )
            return [
              {
                updateOne: {
                  filter: { _id: document._id },
                  update: { $set: newFieldsUpdateOnlyEmpty },
                },
              },
            ]
          })
          if (dataToWrite.length) {
            await getDbCollection("computed_jobs_partners").bulkWrite(dataToWrite, {
              ordered: false,
            })
            counters.success += dataToWrite.length
          }
          const documentsWithMissingData = documents.filter((_document, index) => !responses[index])
          if (documentsWithMissingData.length) {
            await getDbCollection("computed_jobs_partners").bulkWrite(
              documentsWithMissingData.map((document) => {
                return {
                  updateOne: {
                    filter: { _id: document._id },
                    update: {
                      $push: {
                        errors: {
                          source: job,
                          error: `data not found`,
                        },
                      },
                    },
                  },
                }
              }),
              {
                ordered: false,
              }
            )
            counters.error += documentsWithMissingData.length
          }
        } catch (err) {
          counters.error += documents.length
          const newError = internal(`error pour lors du traitement d'un groupe de documents`)
          logger.error(newError.message, err)
          newError.cause = err
          sentryCaptureException(newError)
          if (documents.length) {
            await getDbCollection("computed_jobs_partners").bulkWrite(
              documents.map((document) => {
                return {
                  updateOne: {
                    filter: { _id: document._id },
                    update: {
                      $push: {
                        errors: {
                          source: job,
                          error: err + "",
                        },
                      },
                    },
                  },
                }
              }),
              {
                ordered: false,
              }
            )
          }
        }
      },
      { parallel: 1 }
    )
  )
  logger.info(`job ${job} : enrichissement terminé`, counters)
}
