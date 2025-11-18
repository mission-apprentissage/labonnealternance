import { Writable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import { internal } from "@hapi/boom"
import type { AnyBulkWriteOperation, Filter } from "mongodb"
import type { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger as globalLogger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

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
export const fillFieldsForPartnersFactory = async <SourceFields extends keyof IComputedJobsPartners, FilledFields extends keyof IComputedJobsPartners | "business_error">({
  job,
  sourceFields,
  filledFields,
  getData,
  groupSize,
  replaceMatchFilter,
  addedMatchFilter,
  shouldNotifySlack = true,
}: {
  job: COMPUTED_ERROR_SOURCE
  sourceFields: readonly SourceFields[]
  filledFields: readonly FilledFields[]
  getData: (sourceFields: Pick<IComputedJobsPartners, SourceFields | FilledFields | "_id">[]) => Promise<Array<Pick<IComputedJobsPartners, FilledFields | "_id">>>
  groupSize: number
  replaceMatchFilter?: Filter<IComputedJobsPartners>
  addedMatchFilter?: Filter<IComputedJobsPartners>
  shouldNotifySlack?: boolean
}) => {
  const logger = globalLogger.child({ job })
  logger.info(`job ${job} : début d'enrichissement des données`)

  const filters: Filter<IComputedJobsPartners>[] = [
    { $or: sourceFields.map((field) => ({ [field]: { $ne: null } })) },
    { $or: filledFields.map((field) => ({ [field]: null })) },
    { business_error: null, jobs_in_success: { $nin: [job] } },
  ]
  if (addedMatchFilter) filters.push(addedMatchFilter)

  const queryFilter: Filter<IComputedJobsPartners> = replaceMatchFilter ?? { $and: filters }

  const toUpdateCount = await getDbCollection("computed_jobs_partners").countDocuments(queryFilter)
  logger.info(`${toUpdateCount} documents à traiter`)

  const counters = { total: 0, success: 0, error: 0 }
  const now = new Date()

  const sourceStream = getDbCollection("computed_jobs_partners")
    .find(queryFilter, {
      projection: {
        ...Object.fromEntries([...sourceFields, ...filledFields].map((field) => [field, 1])),
        _id: 1,
        jobs_in_success: 1,
      },
    })
    .stream()

  const groupTransform = new Transform({
    objectMode: true,
    readableObjectMode: true,
    writableObjectMode: true,
  })

  let buffer: IComputedJobsPartners[] = []

  groupTransform._transform = function (chunk, _, callback) {
    buffer.push(chunk)
    if (buffer.length >= groupSize) {
      const group = buffer
      buffer = []
      this.push(group)
    }
    callback()
  }

  groupTransform._flush = function (callback) {
    if (buffer.length) this.push(buffer)
    callback()
  }

  const processGroup = new Writable({
    objectMode: true,
    async write(documents: IComputedJobsPartners[], _, callback) {
      if (!documents.length) return callback()

      counters.total += documents.length
      if (counters.total % 10_000 === 0) logger.info(`processing document ${counters.total}`)

      try {
        const responses = await getData(documents)
        const dataToWrite = responses.flatMap((response) => {
          const { _id, ...newFields } = response
          const updates: AnyBulkWriteOperation<IComputedJobsPartners>[] = [
            { updateOne: { filter: { _id }, update: { $pull: { errors: { source: job } } } } },
            { updateOne: { filter: { _id }, update: { $set: { ...newFields, updated_at: now } } } },
          ]
          const doc = documents.find((d) => d._id.equals(_id))
          if (doc && !doc.jobs_in_success.includes(job)) {
            updates.push({
              updateOne: { filter: { _id }, update: { $push: { jobs_in_success: job } } },
            })
          }
          return updates
        })

        if (dataToWrite.length) {
          await getDbCollection("computed_jobs_partners").bulkWrite(dataToWrite, { ordered: false })
          counters.success += responses.length
        }

        const missing = documents.filter((_, i) => !responses[i])
        if (missing.length) {
          await getDbCollection("computed_jobs_partners").bulkWrite(
            missing.map((doc) => ({
              updateOne: {
                filter: { _id: doc._id },
                update: {
                  $push: {
                    errors: { source: job, error: `data not found` },
                  },
                },
              },
            })),
            { ordered: false }
          )
          counters.error += missing.length
        }
        callback()
      } catch (err) {
        counters.error += documents.length
        const newError = internal(`error lors du traitement d'un groupe de documents`)
        logger.error(err, newError.message)
        sentryCaptureException(newError)

        await getDbCollection("computed_jobs_partners").bulkWrite(
          documents.flatMap((doc) => [
            {
              updateOne: {
                filter: { _id: doc._id },
                update: { $pull: { errors: { source: job } } },
              },
            },
            {
              updateOne: {
                filter: { _id: doc._id },
                update: {
                  $push: {
                    errors: { source: job, error: `${err}` },
                  },
                },
              },
            },
          ]),
          { ordered: true }
        )
        callback()
      }
    },
  })

  await pipeline(sourceStream, groupTransform, processGroup)

  const message = `job ${job} : enrichissement terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`
  logger.info(message)

  if (counters.error > 0 && shouldNotifySlack) {
    await notifyToSlack({
      subject: `computedJobPartners: enrichissement de données`,
      message,
      error: true,
    })
  }
}
