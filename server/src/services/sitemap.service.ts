import { ObjectId } from "mongodb"
import { RECRUITER_STATUS } from "shared/constants"
import { IJob, IRecruiter, JOB_STATUS } from "shared/models"
import { ISitemap } from "shared/models/sitemap.model"
import { generateSitemapFromUrlEntries } from "shared/utils/sitemapUtils"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import dayjs from "@/services/dayjs.service"

type AggregateRecruiter = Pick<Omit<IRecruiter, "jobs">, "updatedAt"> & {
  jobs: Pick<IJob, "job_update_date" | "_id">
}

const SITEMAP_EXPIRATION_IN_HOURS = 6

const generateSitemap = async (): Promise<string> => {
  const documents = (await getDbCollection("recruiters")
    .aggregate([
      { $match: { status: RECRUITER_STATUS.ACTIF, "jobs.job_status": JOB_STATUS.ACTIVE } },
      { $unwind: { path: "$jobs" } },
      { $match: { "jobs.job_status": JOB_STATUS.ACTIVE } },
      { $project: { updatedAt: 1, "jobs.job_update_date": 1, "jobs._id": 1 } },
    ])
    .limit(Number.MAX_SAFE_INTEGER)
    .toArray()) as AggregateRecruiter[]

  const sitemap = generateSitemapFromUrlEntries(
    documents.map((document) => {
      const { jobs: job, updatedAt } = document
      const { job_update_date, _id } = job
      const lastMod = job_update_date && dayjs(updatedAt).isBefore(job_update_date) ? job_update_date : updatedAt
      const url = `${config.publicUrl}/recherche-apprentissage?type=matcha&itemId=${_id}`
      return {
        loc: url,
        lastmod: lastMod,
        changefreq: "daily",
      }
    })
  )
  const sizeInMo = sitemap.length / (1024 * 1024)
  const message = `Generated sitemap with ${documents.length} offers. size: ~${sizeInMo.toFixed(1)} Mo. Max 50 Mo`
  logger.info(message)
  notifyToSlack({
    subject: "job de génération du sitemap des offres",
    message,
    error: documents.length === 0 || sizeInMo > 40,
  })
  return sitemap
}

export const getSitemap = async (): Promise<ISitemap> => {
  const expirationDate = dayjs().subtract(SITEMAP_EXPIRATION_IN_HOURS, "hours")
  let dbSitemap = await getDbCollection("sitemaps").findOne({ created_at: { $gt: expirationDate.toDate() } })
  if (!dbSitemap || dayjs(dbSitemap.created_at).isBefore(expirationDate)) {
    await getDbCollection("sitemaps").deleteMany({ created_at: { $lt: expirationDate.toDate() } })
    const xml = await generateSitemap()
    dbSitemap = {
      _id: new ObjectId(),
      created_at: new Date(),
      xml,
    }
    await getDbCollection("sitemaps").insertOne(dbSitemap)
  }
  return dbSitemap
}
