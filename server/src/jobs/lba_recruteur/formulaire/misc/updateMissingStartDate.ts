import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../../common/logger"
import { asyncForEach } from "../../../../common/utils/asyncUtils"

export const updateMissingStartDate = async () => {
  logger.info("Start update missing job_start_date")
  const forms = await getDbCollection("recruiters").find({ "jobs.job_start_date": null }).toArray()
  await asyncForEach(forms, async (form) => {
    await asyncForEach(form.jobs, async (job) => {
      if (job.job_start_date === null) {
        if (job.job_creation_date) {
          job.job_start_date = job.job_creation_date
        }
      }
    })
    await getDbCollection("recruiters").updateOne({ _id: form._id }, { $set: { ...form } })
  })
  logger.info("End update missing job_start_date")
}
