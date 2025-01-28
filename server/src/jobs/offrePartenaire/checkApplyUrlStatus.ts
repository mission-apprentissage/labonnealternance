import { Transform, Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { AnyBulkWriteOperation, FindCursor, type ObjectId } from "mongodb"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { streamGroupByCount } from "@/common/utils/streamUtils"

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

const checkUrlStatus = async (_id: ObjectId, url: string): Promise<AnyBulkWriteOperation<IComputedJobsPartners> | null> => {
  const status = await fetch(url)
    .then((res) => {
      return res.status
    })
    .catch((error) => {
      logger.error(`Erreur lors de la requête HTTP : ${error}`)
      return 0
    })

  if (status >= 200 && status < 400) {
    return null
  }

  return {
    updateOne: {
      filter: { _id },
      update: {
        $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.URL_UNAVAILABLE },
      },
    },
  }
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

  const cursor: FindCursor<{ _id: ObjectId; apply_url: string }> = getDbCollection("computed_jobs_partners").find<{ _id: ObjectId; apply_url: string }>(
    { business_error: null, apply_url: { $ne: null } },
    { projection: { _id: 1, apply_url: 1 } }
  )

  await pipeline(
    cursor,
    new Transform({
      objectMode: true,
      highWaterMark: 50,
      async transform(chunk: { _id: ObjectId; apply_url: string }, encoding, callback) {
        counters.total++
        const op = await checkUrlStatus(chunk._id, chunk.apply_url)

        if (op) {
          counters.error++
          callback(null, op)
        } else {
          counters.success++
          callback()
        }
      },
    }),
    streamGroupByCount(1_000),
    new Writable({
      objectMode: true,
      async write(chunk: Array<AnyBulkWriteOperation<IComputedJobsPartners> | null>, encoding, callback) {
        if (counters.total % BATCH_SIZE === 0) {
          logger.info(`Progression : ${counters.total}/${count} URLs traitées (Succès : ${counters.success}, Erreurs : ${counters.error})`)
        }

        const ops = chunk.filter((op) => op != null)

        if (ops.length > 0) {
          await collection.bulkWrite(ops)
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
