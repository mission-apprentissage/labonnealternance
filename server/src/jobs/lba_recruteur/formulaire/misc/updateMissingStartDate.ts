import { logger } from "../../../../common/logger"
import { Recruiter } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"

export const updateMissingStartDate = async () => {
  logger.info("Start update missing job_start_date")
  const forms = await Recruiter.find({ "jobs.job_start_date": null })
  await asyncForEach(forms, async (form) => {
    await asyncForEach(form.jobs, async (job) => {
      if (job.job_start_date === null) {
        if (job.job_creation_date) {
          job.job_start_date = job.job_creation_date
        }
      }
    })
    await form.save({ timestamps: false })
  })
  logger.info("End update missing job_start_date")
}
