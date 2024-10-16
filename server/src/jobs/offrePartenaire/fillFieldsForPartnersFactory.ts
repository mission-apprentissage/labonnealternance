import { internal } from "@hapi/boom"
import { Filter } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { IJobsPartnersOfferPrivate, ZJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "
import { entriesToTypedRecord } from "shared/utils"

import { logger as globalLogger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"

export const fillFieldsForPartnersFactory = async <SourceFields extends keyof IJobsPartnersOfferPrivate, FilledFields extends keyof IJobsPartnersOfferPrivate>({
  job,
  sourceFields,
  filledFields,
  getData,
}: {
  job: COMPUTED_ERROR_SOURCE
  sourceFields: readonly SourceFields[]
  filledFields: readonly FilledFields[]
  getData: (sourceFields: Pick<IComputedJobsPartners, SourceFields>) => Promise<Partial<Pick<IComputedJobsPartners, FilledFields>>>
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
    writeData(
      async (document: IComputedJobsPartners) => {
        counters.total++
        counters.total % 1000 === 0 && logger.info(`processing document ${counters.total}`)
        try {
          const newFields = await getData(document)
          const entries = Object.entries(newFields) as [FilledFields, IComputedJobsPartners[FilledFields]][]
          const newFieldsUpdateOnlyEmpty = entriesToTypedRecord(
            entries.filter(([key, _value]) => {
              const oldValue = document[key]
              return oldValue === undefined || oldValue === null || oldValue === ""
            })
          )
          const result = await getDbCollection("computed_jobs_partners").findOneAndUpdate(
            { _id: document._id },
            {
              $set: newFieldsUpdateOnlyEmpty,
            },
            {
              returnDocument: "after",
            }
          )
          if (!result) {
            throw new Error(`inattendu: document id=${document._id} introuvable`)
          }
          const computedJobPartner: IComputedJobsPartners = result
          if (ZJobsPartnersOfferPrivate.safeParse(computedJobPartner).success) {
            await getDbCollection("computed_jobs_partners").updateOne(
              { _id: document._id },
              {
                $set: {
                  validated: true,
                },
              }
            )
          }
          counters.success++
        } catch (err) {
          counters.error++
          const newError = internal(`error pour le document avec id=${document._id}`)
          logger.error(newError.message, err)
          newError.cause = err
          sentryCaptureException(newError)
          await getDbCollection("computed_jobs_partners").updateOne(
            { _id: document._id },
            {
              $push: {
                errors: {
                  source: job,
                  error: err + "",
                },
              },
            }
          )
        }
      },
      { parallel: 10 }
    )
  )
  logger.info(`job ${job} : enrichissement terminé`, counters)
}
