import { ObjectId } from "mongodb"
import { RECRUITER_STATUS } from "shared/constants"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IJob, IRecruiter, JOB_STATUS } from "shared/models"
import { ISitemap } from "shared/models/sitemap.model"
import { buildJobUrl, hashcode } from "shared/utils"
import { generateSitemapFromUrlEntries } from "shared/utils/sitemapUtils"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import dayjs from "@/services/dayjs.service"

type AggregateRecruiter = Pick<Omit<IRecruiter, "jobs">, "updatedAt"> & {
  jobs: Pick<IJob, "job_update_date" | "_id" | "rome_label" | "rome_appellation_label">
}

const generateSitemapXml = async () => {
  const documents = (await getDbCollection("recruiters")
    .aggregate([
      { $match: { status: RECRUITER_STATUS.ACTIF, "jobs.job_status": JOB_STATUS.ACTIVE } },
      { $unwind: { path: "$jobs" } },
      { $match: { "jobs.job_status": JOB_STATUS.ACTIVE } },
      { $project: { updatedAt: 1, "jobs.job_update_date": 1, "jobs._id": 1, "jobs.rome_label": 1, "jobs.rome_appellation_label": 1 } },
    ])
    .limit(Number.MAX_SAFE_INTEGER)
    .toArray()) as AggregateRecruiter[]

  const sitemap = generateSitemapFromUrlEntries(
    documents.map((document) => {
      const { jobs: job, updatedAt } = document
      const { job_update_date, _id, rome_label, rome_appellation_label } = job
      const lastMod = job_update_date && dayjs(updatedAt).isBefore(job_update_date) ? job_update_date : updatedAt
      const jobTitle = rome_appellation_label ?? rome_label
      const url = `${config.publicUrl}${buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, _id, jobTitle)}`
      return {
        loc: url,
        lastmod: lastMod,
        changefreq: "daily",
      }
    })
  )
  return { xml: sitemap, count: documents.length }
}

export const generateSitemap = async () => {
  const { xml, count } = await generateSitemapXml()
  const hash = hashcode(xml)
  let dbSitemap = await getDbCollection("sitemaps").findOne({ hashcode: hash.toString() })
  if (!dbSitemap) {
    await getDbCollection("sitemaps").deleteMany({})
    dbSitemap = {
      _id: new ObjectId(),
      created_at: new Date(),
      xml: xml,
      hashcode: hash.toString(),
    }
    await getDbCollection("sitemaps").insertOne(dbSitemap)
    const sizeInMo = xml.length / (1024 * 1024)
    const message = `Generated sitemap with ${count} offers. size: ~${sizeInMo.toFixed(1)} Mo. Max 50 Mo`
    logger.info(message)
    await notifyToSlack({
      subject: "job de génération du sitemap des offres",
      message,
      error: count === 0 || sizeInMo > 40,
    })
  }
}

export const getSitemap = async (): Promise<ISitemap> => {
  let dbSitemap = await getDbCollection("sitemaps").findOne({})
  if (!dbSitemap) {
    // should not happen but added for safety
    const { xml } = await generateSitemapXml()
    dbSitemap = {
      _id: new ObjectId(),
      created_at: new Date(),
      xml,
      hashcode: hashcode(xml).toString(),
    }
    await getDbCollection("sitemaps").insertOne(dbSitemap)
    await notifyToSlack({
      subject: "job de génération du sitemap des offres",
      message: `Inattendu : génération du sitemap par le backend alors qu il aurait dû être généré par le job processor !`,
      error: true,
    })
  }
  return dbSitemap
}
