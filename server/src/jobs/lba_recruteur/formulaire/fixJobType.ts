import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { updateOffre } from "@/services/formulaire.service"

export const fixJobType = async () => {
  const misspelledProfessionalisation = "Professionalisation"

  const recruiters = await getDbCollection("recruiters")
    .find({
      "jobs.job_type": misspelledProfessionalisation,
    })
    .toArray()
  const stats = { success: 0, failure: 0 }
  logger.info(`Correction des job type=Professionalisation: ${recruiters.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruiters, async (recruiter) => {
    try {
      const { jobs } = recruiter
      await asyncForEach(jobs, async (job) => {
        const { job_type } = job
        // @ts-expect-error
        const fixedJobType = job_type.map((value) => (value === misspelledProfessionalisation ? TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION : value))
        await updateOffre(job._id, { ...job, job_type: fixedJobType })
      })
      stats.success++
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Correction des job type=Professionalisation",
    message: `${stats.failure} erreurs. ${stats.success} recruteurs mis à jour`,
    error: stats.failure > 0,
  })
  return stats
}
