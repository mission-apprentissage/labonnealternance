import { logger } from "../../../../common/logger"
import { Recruiter } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { runScript } from "../../../scriptWrapper"

runScript(async () => {
  logger.info("Start update contract duration job")
  const formulaires = await Recruiter.find({ "offres.duree_contrat": { $gt: 36 } })

  await asyncForEach(formulaires, async (form) => {
    if (!form.jobs.length) return

    await asyncForEach(form.jobs, async (job) => {
      if (job.job_duration > 36) {
        job.job_duration = 36
      }
    })
    await form.save({ timestamps: false })
  })
  logger.info("End update contract duration job")
})
