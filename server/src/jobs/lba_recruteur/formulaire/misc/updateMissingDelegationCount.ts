import { logger } from "../../../../common/logger"
import { Recruiter } from "../../../../common/model/index"
import { IJobs } from "../../../../common/model/schema/jobs/jobs.types"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { runScript } from "../../../scriptWrapper"

runScript(async () => {
  logger.info("Start update delegation count job")
  const forms = await Recruiter.find({ "jobs.delegations": { $not: { $size: 0 }, $ne: null }, jobs: { $not: { $size: 0 } } })

  await asyncForEach(forms, async (form) => {
    await asyncForEach(form.jobs, async (job: IJobs) => {
      job.job_delegation_count = job.delegations.length
    })
    await form.save({ timestamps: false })
  })
  logger.info("End update delegation count job")
})
