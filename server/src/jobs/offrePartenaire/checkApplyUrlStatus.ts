import { AnyBulkWriteOperation, FindCursor, type ObjectId } from "mongodb"
import PQueue from "p-queue"
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

const BATCH_SIZE = 1000

const checkUrlStatus = async (_id: ObjectId, url: string): Promise<AnyBulkWriteOperation<IComputedJobsPartners> | null> => {
  const status = await fetch(url, { keepalive: true })
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

export async function checkApplyUrlStatus() {
  logger.info(`Validation des computed_job_partners`)
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

  const counters = { total: 0, success: 0, error: 0, startTime: Date.now() }

  const queue = new PQueue({ concurrency: BATCH_SIZE })
  const bulk: Array<AnyBulkWriteOperation<IComputedJobsPartners>> = []

  for await (const doc of cursor) {
    queue.add(async () => {
      const op = await checkUrlStatus(doc._id, doc.apply_url)
      counters.total++
      if (op) {
        counters.error++
        bulk.push(op)
      } else {
        counters.success++
      }

      if (bulk.length > BATCH_SIZE) {
        // Prevent concurrency issues by copying the bulk array
        const currentBulk = [...bulk]
        bulk.length = 0

        await collection.bulkWrite(currentBulk)
        const elapsed = Date.now() - counters.startTime
        const reqPerSec = Math.round((counters.total / elapsed) * 1000)
        logger.info(`Progression : ${counters.total}/${count} URLs traitées (Succès : ${counters.success}, Erreurs : ${counters.error}, Req/s: ${reqPerSec})`)
      }
    })

    await queue.onEmpty()
  }

  if (bulk.length > 0) {
    await collection.bulkWrite(bulk)
  }

  logger.info(`Traitement terminé. Total: ${counters.total}, Succès: ${counters.success}, Erreurs: ${counters.error}`)
}
