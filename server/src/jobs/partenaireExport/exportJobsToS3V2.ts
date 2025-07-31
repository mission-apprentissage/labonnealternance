import { createReadStream, createWriteStream } from "fs"
import Stream, { Transform } from "stream"
import { pipeline } from "stream/promises"

import { JOB_STATUS_ENGLISH } from "shared"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { concatStreams, waitForStreamEnd } from "@/common/utils/streamUtils"
import { jobsPartnersToApiV3Read } from "@/services/jobs/jobOpportunity/jobOpportunity.service"

import { logger } from "../../common/logger"
import { s3WriteStream } from "../../common/utils/awsUtils"
import { getDbCollection } from "../../common/utils/mongodbUtils"

const getFileWriteStream = (fileName: string) => {
  logger.info(`Generating file ${fileName}`)
  const url = new URL(`./${fileName}`, import.meta.url)
  const writeStream = createWriteStream(url)
  return { writeStream, filePath: url.pathname }
}

const uploadFileToS3 = async (filepath: string, readStream: Stream.Readable) => {
  const key = filepath.split("/").pop() as string
  logger.info(`Uploading file ${filepath} to S3`)
  await s3WriteStream("storage", key, { Body: readStream, CacheControl: "no-cache, no-store, must-revalidate" })
  logger.info(`file ${filepath} uploaded`)
}

export const EXPORT_JOBS_TO_S3_V2_FILENAME = "exportJobsToS3V2.json"

export async function exportJobsToS3V2(handleFileReadStream = uploadFileToS3) {
  const { filePath, writeStream: fileStream } = getFileWriteStream(EXPORT_JOBS_TO_S3_V2_FILENAME)
  const jsonArrayTransform = getJsonArrayTransform()
  jsonArrayTransform.setMaxListeners(20)

  const jobPartnersTransform = getCusorTransform<IJobsPartnersOfferPrivate>((jobPartner) => {
    return JSON.stringify(jobsPartnersToApiV3Read(jobPartner), null, 2)
  })

  concatStreams([jobPartnersTransform], jsonArrayTransform)
  jsonArrayTransform.pipe(fileStream, { end: true })

  logger.info("starting job partners cursor")
  const jobPartnersCursor = await getDbCollection("jobs_partners").find({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_multicast: true })
  await pipeline(jobPartnersCursor, jobPartnersTransform)

  logger.info("waiting for jsonArrayTransform")
  await waitForStreamEnd(jsonArrayTransform)
  console.log("waiting for fileStream")
  await waitForStreamEnd(fileStream)

  logger.info("creating read stream")
  const fileReadStream = createReadStream(filePath)
  await handleFileReadStream(filePath, fileReadStream)
}

function getJsonArrayTransform() {
  let isFirst = true
  const transform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (!chunk) {
        callback()
        return
      }
      if (isFirst) {
        this.push("[")
        isFirst = false
      } else {
        this.push(",")
      }
      this.push(chunk)
      callback()
    },
    flush(callback) {
      if (isFirst) {
        this.push("[")
        isFirst = false
      }
      this.push("]")
      callback()
    },
  })
  return transform
}

const getCusorTransform = <T>(mapper: (obj: T) => string | null) => {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk: T, encoding, callback) {
      const result = mapper(chunk)
      if (result !== null) {
        this.push(result)
      }
      callback()
    },
    flush(callback) {
      callback()
    },
  })
}
