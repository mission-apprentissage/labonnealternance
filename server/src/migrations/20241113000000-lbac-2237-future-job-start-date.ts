import dayjs from "dayjs"
import { Db } from "mongodb"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async (_db: Db) => {
  logger.info("20241113000000-lbac-2237-future-job-start-date started")

  const maxStartDate = new Date("2026-01-01")

  const recruiters = await getDbCollection("recruiters")
    .find({ "jobs.job_start_date": { $gt: maxStartDate } })
    .toArray()
  await asyncForEach(recruiters, async (recruiter) => {
    recruiter.jobs.forEach((job) => {
      if (dayjs(job.job_start_date).isSameOrAfter(dayjs(maxStartDate))) {
        job.job_start_date = maxStartDate
      }
    })
    await getDbCollection("recruiters").updateOne({ _id: recruiter._id }, { $set: recruiter })
  })

  logger.info("20241113000000-lbac-2237-future-job-start-date ended")
}
