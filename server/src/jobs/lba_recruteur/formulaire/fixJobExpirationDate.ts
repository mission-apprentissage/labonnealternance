import dayjs from "dayjs"

import { logger } from "@/common/logger"
import { Recruiter } from "@/common/model"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { updateOffre } from "@/services/formulaire.service"

export const fixJobExpirationDate = async () => {
  const latestExpirationDate = dayjs().add(1, "month")
  const recruiters = await Recruiter.find({
    "jobs.job_expiration_date": { $gt: latestExpirationDate.toDate() },
  }).lean()
  const stats = { success: 0, failure: 0, jobSuccess: 0 }
  logger.info(`Correction des dates d'expiration des offres: ${recruiters.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruiters, async (recruiter) => {
    try {
      const { jobs } = recruiter
      await asyncForEach(jobs, async (job) => {
        const { job_expiration_date } = job
        if (job_expiration_date && dayjs(job_expiration_date).isAfter(latestExpirationDate)) {
          await updateOffre(job._id, { ...job, job_expiration_date: latestExpirationDate.toDate() })
          stats.jobSuccess++
        }
      })
      stats.success++
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Correction des dates d'expiration des offres",
    message: `${stats.failure} erreurs. ${stats.jobSuccess} offres mises à jour. ${stats.success} recruteurs mis à jour`,
    error: stats.failure > 0,
  })
  return stats
}
