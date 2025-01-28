import { Transform, Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { AnyBulkWriteOperation, FindCursor, WithId } from "mongodb"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"

/**
 * TODO :
 *
 * Check statut trop agressif :
 * prendre en compte le rate limit (409/504/429)
 * bulk write
 */

const BATCH_SIZE = 50

const checkUrlStatus = async (url: string): Promise<number> => {
  const res = await fetch(url)
  if (res.status === 404) {
    return res.status
  }

  return 0
}

export const checkApplyUrlStatus = async () => {
  logger.info(`Validation des computed_job_partners`)
  const counters = { total: 0, success: 0, error: 0 }
  const collection = getDbCollection("computed_jobs_partners")
  const count = await collection.countDocuments({
    business_error: null,
    apply_url: { $ne: null },
  })
  logger.info(`${count} URL(s) d'offre à traiter`)

  const cursor: FindCursor<WithId<Pick<IComputedJobsPartners, "apply_url">>> = getDbCollection("computed_jobs_partners").find(
    { business_error: null, apply_url: { $ne: null } },
    { projection: { _id: 1, apply_url: 1 } }
  )

  await pipeline(
    cursor,
    new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        counters.total++
        try {
          const status = await checkUrlStatus(chunk.apply_url)
          if (status >= 200 && status < 400) {
            counters.success++
            callback()
          } else {
            counters.error++
            const op: AnyBulkWriteOperation<IComputedJobsPartners> = {
              updateOne: {
                filter: {
                  _id: chunk._id,
                },
                update: {
                  $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.URL_UNAVAILABLE },
                },
              },
            }
            callback(null, op)
          }
        } catch (error) {
          counters.error++
          const op: AnyBulkWriteOperation<IComputedJobsPartners> = {
            updateOne: {
              filter: {
                _id: chunk._id,
              },
              update: {
                $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.URL_UNAVAILABLE },
              },
            },
          }
          callback(null, op)
        }
      },
    }),
    new Writable({
      objectMode: true,
      async write(chunk, encoding, callback) {
        if (counters.total % BATCH_SIZE === 0) {
          logger.info(`Progression : ${counters.total}/${count} URLs traitées (Succès : ${counters.success}, Erreurs : ${counters.error})`)
        }
        if (chunk) {
          await collection.bulkWrite([chunk])
        }
        callback()
      },
    })
  )

  // await oleoduc(
  //   collection.find({ business_error: null, apply_url: { $ne: null } }, { projection: { _id: 1, apply_url: 1 } }).stream(),
  //   streamGroupByCount(BATCH_SIZE),
  //   writeData(
  //     async (batch: IJobApplyUrls[]) => {
  //       // if http --> business_error URL_PROTOCOL
  //       counters.total += batch.length

  //       // Traitement des URL dans le batch avec `Promise.all`
  //       const bulk = []
  //       await Promise.all(
  //         batch.map(async (doc) => {
  //           try {
  //             const status = await checkUrlStatus(doc.apply_url)

  //             if (status >= 200 && status < 400) {
  //               counters.success++
  //             } else {
  //               counters.error++
  //               // bulk.push[{}] bulk op
  //               await collection.updateOne({ _id: doc._id }, { $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.URL_UNAVAILABLE } })
  //             }
  //           } catch (error) {
  //             counters.error++
  //             await collection.updateOne({ _id: doc._id }, { $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.URL_UNAVAILABLE } })
  //           }
  //         })
  //       )
  //       if (counters.total % BATCH_SIZE === 0) {
  //         logger.info(`Progression : ${counters.total}/${count} URLs traitées (Succès : ${counters.success}, Erreurs : ${counters.error})`)
  //       }
  //     },
  //     { parallel: 1 }
  //   )
  // )

  logger.info(`Traitement terminé. Total: ${counters.total}, Succès: ${counters.success}, Erreurs: ${counters.error}`)
}
