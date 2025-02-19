import { internal } from "@hapi/boom"
import { AnyBulkWriteOperation, Filter } from "mongodb"
import { oleoduc, writeData } from "oleoduc"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger as globalLogger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { streamGroupByCount } from "@/common/utils/streamUtils"

/**
 * Fonction permettant de facilement enrichir un computedJobPartner avec de nouvelles données provenant d'une source async
 *
 * @param job: nom du job
 * @param sourceFields: champs nécessaires à la récupération des données (au moins un doit être renseigné)
 * @param filledFields: champs potentiellement modifiés par l'enrichissement (au moins un doit être null)
 * @param groupSize: taille du packet de documents (utile pour optimiser les appels API et BDD)
 * @param replaceMatchFilter: si présent, remplace le filtre source de la collection computed_jobs_partners
 * @param addedMatchFilter: si présent et replaceMatchFilter absent, ajoute une condition sur le filtre source de la collection computed_jobs_partners
 * @param getData: fonction récupérant les nouvelles données.
 * La fonction doit retourner un tableau d'objet contenant l'_id du document à mettre à jour et les nouvelles valeurs à mettre à jour.
 * Les valeurs retournées seront modifiées et écraseront les anciennes données.
 */
export const fillFieldsForPartnersFactory = async <SourceFields extends keyof IJobsPartnersOfferPrivate, FilledFields extends keyof IJobsPartnersOfferPrivate | "business_error">({
  job,
  sourceFields,
  filledFields,
  getData,
  groupSize,
  replaceMatchFilter,
  addedMatchFilter,
}: {
  job: COMPUTED_ERROR_SOURCE
  sourceFields: readonly SourceFields[]
  filledFields: readonly FilledFields[]
  getData: (sourceFields: Pick<IComputedJobsPartners, SourceFields | FilledFields | "_id">[]) => Promise<Array<Pick<IComputedJobsPartners, FilledFields | "_id">>>
  groupSize: number
  replaceMatchFilter?: Filter<IComputedJobsPartners>
  addedMatchFilter?: Filter<IComputedJobsPartners>
}) => {
  const logger = globalLogger.child({
    job,
  })
  logger.info(`job ${job} : début d'enrichissement des données`)
  const queryFilter: Filter<IComputedJobsPartners> = replaceMatchFilter ?? {
    $and: [
      {
        $or: sourceFields.map((field) => ({ [field]: { $ne: null } })),
      },
      {
        $or: filledFields.map((field) => ({ [field]: null })),
      },
      {
        business_error: null,
        jobs_in_success: { $nin: [job] },
      },
      ...(addedMatchFilter ? [addedMatchFilter] : []),
    ],
  }
  const toUpdateCount = await getDbCollection("computed_jobs_partners").countDocuments(queryFilter)
  logger.info(`${toUpdateCount} documents à traiter`)
  const counters = { total: 0, success: 0, error: 0 }
  const now = new Date()
  await oleoduc(
    getDbCollection("computed_jobs_partners")
      .find(queryFilter, {
        projection: {
          ...Object.fromEntries([...sourceFields, ...filledFields].map((field) => [field, 1])),
          _id: 1,
          jobs_in_success: 1,
        },
      })
      .stream(),
    streamGroupByCount(groupSize),
    writeData(
      async (documents: IComputedJobsPartners[]) => {
        counters.total += documents.length
        counters.total % 1000 === 0 && logger.info(`processing document ${counters.total}`)
        try {
          const responses = await getData(documents)

          const dataToWrite = responses.flatMap((response) => {
            const { _id, ...newFields } = response
            const updates: AnyBulkWriteOperation<IComputedJobsPartners>[] = [
              {
                updateOne: {
                  filter: { _id },
                  update: { $pull: { errors: { source: job } } },
                },
              },
              {
                updateOne: {
                  filter: { _id },
                  update: { $set: { ...newFields, updated_at: now } },
                },
              },
            ]
            const document = documents.find((doc2) => doc2._id.equals(_id))
            if (!document?.jobs_in_success.includes(job)) {
              updates.push({
                updateOne: {
                  filter: { _id },
                  update: {
                    $push: {
                      jobs_in_success: job,
                    },
                  },
                },
              })
            }
            return updates
          })
          if (dataToWrite.length) {
            await getDbCollection("computed_jobs_partners").bulkWrite(dataToWrite, {
              ordered: false,
            })
            counters.success += responses.length
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
          const newError = internal(`error lors du traitement d'un groupe de documents`)
          logger.error(newError.message, err)
          newError.cause = err
          sentryCaptureException(newError)
          if (documents.length) {
            await getDbCollection("computed_jobs_partners").bulkWrite(
              documents.flatMap((document) => {
                return [
                  {
                    updateOne: {
                      filter: { _id: document._id },
                      update: { $pull: { errors: { source: job } } },
                    },
                  },
                  {
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
                  },
                ]
              }),
              {
                ordered: true,
              }
            )
          }
        }
      },
      { parallel: 1 }
    )
  )
  const message = `job ${job} : enrichissement terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`
  logger.info(message)
  if (counters.error > 0) {
    await notifyToSlack({
      subject: `computedJobPartners: enrichissement de données`,
      message,
      error: counters.error > 0,
    })
  }
}
