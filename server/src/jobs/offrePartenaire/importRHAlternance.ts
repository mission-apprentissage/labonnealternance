import { internal } from "@hapi/boom"
import axios from "axios"
import { ObjectId } from "mongodb"
import { IRawRHAlternance } from "shared/models/rawRHAlternance.model"
import { z } from "zod"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"

const ZRHAlternanceResponse = z
  .object({
    jobs: z.array(z.unknown()),
    pageCount: z.number(),
  })
  .passthrough()

const destinationCollection = "raw_rhalternance"

export const importRHAlternance = async () => {
  logger.info("deleting old data")
  await getDbCollection(destinationCollection).deleteMany({})
  logger.info("import starting...")

  let shouldContinue = true
  let currentPage = 1
  let pageCount: number | null = null
  let jobCount = 0
  const importDate = new Date()
  while (shouldContinue) {
    logger.info(`import of RHAlternance: page ${currentPage} / ${pageCount ?? "?"}`)
    const response = await axios.request({
      method: "POST",
      url: "https://rhalternance.com/api/jobs",
      headers: {
        Authorization: config.rhalternance.apiKey,
      },
      data: `Page=${currentPage}`,
    })
    if (response.status >= 400) {
      throw internal(`Error when calling RHAlternance: status=${response.status}`, { data: response.data })
    }
    const parsed = ZRHAlternanceResponse.safeParse(response.data)
    if (!parsed.success) {
      throw internal(`Error when parsing RHAlternance response`, { error: parsed.error })
    }
    const savedJobs: IRawRHAlternance[] = parsed.data.jobs.map((job) => ({ job, createdAt: importDate, _id: new ObjectId() }))
    if (savedJobs.length) {
      await getDbCollection(destinationCollection).insertMany(savedJobs)
      currentPage++
      pageCount = parsed.data.pageCount
    } else {
      shouldContinue = false
    }
    jobCount += savedJobs.length
  }
  logger.info(`import done: ${jobCount} jobs imported`)
}
