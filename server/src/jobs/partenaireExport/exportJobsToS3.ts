import { createWriteStream } from "fs"
import { Readable, Transform } from "stream"
import { pipeline } from "stream/promises"

import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { logger } from "../../common/logger"
import { uploadFileToS3 } from "../../common/utils/awsUtils"
import { getDbCollection } from "../../common/utils/mongodbUtils"

interface IGeneratorParams {
  collection: "jobs" | "recruteurslba"
  query: object
  projection: object
  fileName: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA | LBA_ITEM_TYPE.RECRUTEURS_LBA
}

async function generateJsonExport({ collection, query, projection, fileName }: IGeneratorParams): Promise<string> {
  logger.info(`Generating file ${fileName}`)
  const filePath = new URL(`./${fileName}.json`, import.meta.url)
  const data = await getDbCollection(collection).find(query).project(projection)
  const writable = createWriteStream(filePath)
  const readable = Readable.from(data.map((doc) => JSON.stringify(doc, null, 4)))

  // Transform stream to add commas between objects and brackets at the beginning and end
  let isFirst = true
  const transform = new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform(chunk, encoding, callback) {
      if (isFirst) {
        this.push("[" + chunk)
        isFirst = false
      } else {
        this.push("," + chunk)
      }
      callback()
    },
    flush(callback) {
      this.push("]")
      callback()
    },
  })

  await pipeline(readable, transform, writable)

  return filePath.pathname
}

async function exportLbaJobsToS3() {
  const offres_emploi_lba: IGeneratorParams = {
    collection: "jobs",
    query: { job_status: "Active" },
    projection: {
      rome_detail: 0,
      _id: 0,
      delegations: 0,
      address_detail: 0,
      jobId: 0,
      recruiterId: 0,
      email: 0,
      phone: 0,
      first_name: 0,
      last_name: 0,
      relance_mail_sent: 0,
      is_disabled_elligible: 0,
      establishment_id: 0,
      origin: 0,
      recruiterStatus: 0,
      is_multi_published: 0,
      job_delegation_count: 0,
      stats_detail_view: 0,
      stats_search_view: 0,
      job_status: 0,
    },
    fileName: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
  }
  const recruteurs_lba: IGeneratorParams = {
    collection: "recruteurslba",
    query: {},
    projection: { _id: 0, email: 0, phone: 0, geopoint: 0, recruitment_potential: 0, opco_short_name: 0 },
    fileName: LBA_ITEM_TYPE.RECRUTEURS_LBA,
  }
  await Promise.all([
    generateJsonExport(offres_emploi_lba).then((path) => {
      const key = path.split("/").pop() as string
      logger.info(`Uploading file ${key} to S3`)
      uploadFileToS3({ key, filePath: path, noCache: true })
      logger.info(`file ${key} uploaded`)
    }),
    generateJsonExport(recruteurs_lba).then((path) => {
      const key = path.split("/").pop() as string
      logger.info(`Uploading file ${key} to S3`)
      uploadFileToS3({ key, filePath: path, noCache: true })
      logger.info(`File ${key} uploaded`)
    }),
  ])
}

export { exportLbaJobsToS3 }
