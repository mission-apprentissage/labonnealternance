import http from "http"
import https from "https"
import { URL } from "url"

import { ObjectId } from "bson"
import { oleoduc, writeData } from "oleoduc"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { streamGroupByCount } from "../../common/utils/streamUtils"

type IJobApplyUrls = {
  _id: ObjectId
  apply_url: string
}

const checkUrlStatus = (url: string): Promise<number> => {
  return new Promise((resolve) => {
    const { protocol } = new URL(url)
    const httpModule = protocol === "https:" ? https : http

    const req = httpModule.request(url, { method: "HEAD" }, (res) => {
      resolve(res.statusCode || 0)
    })

    req.on("error", () => resolve(0))
    req.end()
  })
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

  await oleoduc(
    collection.find({ business_error: null, apply_url: { $ne: null } }, { projection: { _id: 1, apply_url: 1 } }).stream(),
    streamGroupByCount(50),
    writeData(
      async (batch: IJobApplyUrls[]) => {
        counters.total += batch.length

        // Traitement des URL dans le batch avec `Promise.all`
        await Promise.all(
          batch.map(async (doc) => {
            try {
              const status = await checkUrlStatus(doc.apply_url)

              if (status >= 200 && status < 400) {
                counters.success++
              } else {
                counters.error++
                await collection.updateOne({ _id: doc._id }, { $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.URL_UNAVAILABLE } })
              }
            } catch (error) {
              counters.error++
              await collection.updateOne({ _id: doc._id }, { $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.URL_UNAVAILABLE } })
            }
          })
        )
        if (counters.total % 100 === 0) {
          logger.info(`Progression : ${counters.total}/${count} URLs traitées (Succès : ${counters.success}, Erreurs : ${counters.error})`)
        }
      },
      { parallel: 1 } // Traite un batch à la fois
    )
  )

  logger.info(`Traitement terminé. Total: ${counters.total}, Succès: ${counters.success}, Erreurs: ${counters.error}`)
}
