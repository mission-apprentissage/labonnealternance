import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { ISitemap } from "shared/models/sitemap.model"
import { hashcode } from "shared/utils/index"
import { generateSitemapFromUrlEntries } from "shared/utils/sitemapUtils"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { buildLbaUrl } from "./jobs/jobOpportunity/jobOpportunity.service"

const generateSitemapXml = async () => {
  const lbaJobPartners = await getDbCollection("jobs_partners")
    .find(
      {
        partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      },
      {
        projection: {
          _id: 1,
          updated_at: 1,
          offer_title: 1,
        },
      }
    )
    .toArray()

  const sitemap = generateSitemapFromUrlEntries(
    lbaJobPartners.map((document) => {
      const { updated_at, _id, offer_title } = document
      const url = buildLbaUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, _id, null, offer_title)
      return {
        loc: url,
        lastmod: updated_at,
        changefreq: "daily" as const,
      }
    })
  )
  return { xml: sitemap, count: lbaJobPartners.length }
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
