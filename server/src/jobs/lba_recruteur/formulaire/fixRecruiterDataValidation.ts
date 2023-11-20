import { TRAINING_RYTHM } from "shared/constants/recruteur"
import { z } from "zod"

import { logger } from "@/common/logger"
import { Recruiter } from "@/common/model"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { updateOffre } from "@/services/formulaire.service"

const fixDates = async () => {
  const subject = "Fix data validations pour recruiters : delegations.cfa_read_company_detail_at"
  const recruiters = await Recruiter.find({
    "jobs.delegations.cfa_read_company_detail_at": { $type: "string" },
  }).lean()
  const stats = { success: 0, failure: 0 }
  logger.info(`${subject}: ${recruiters.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruiters, async (recruiter) => {
    try {
      const { jobs } = recruiter
      await asyncForEach(jobs, async (job) => {
        const { delegations } = job
        const fixedDelegations = (delegations ?? []).map((delegation) => {
          const { cfa_read_company_detail_at } = delegation
          if (cfa_read_company_detail_at && typeof cfa_read_company_detail_at === "string") {
            if (!z.coerce.date().safeParse(cfa_read_company_detail_at).success) {
              throw new Error(`could not convert date=${cfa_read_company_detail_at}`)
            }
            delegation.cfa_read_company_detail_at = new Date(cfa_read_company_detail_at)
          }
          return delegation
        })
        await updateOffre(job._id, { ...job, delegegations: fixedDelegations })
      })
      stats.success++
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject,
    message: `${stats.failure} erreurs. ${stats.success} mises à jour`,
    error: stats.failure > 0,
  })
  return stats
}

const fixJobRythm = async () => {
  const subject = "Fix data validations : job_rythm"
  const recruiters = await Recruiter.find({
    "jobs.job_rythm": "1 jours / 4 jours",
  }).lean()
  const stats = { success: 0, failure: 0 }
  logger.info(`${subject}: ${recruiters.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruiters, async (recruiter) => {
    try {
      const { jobs } = recruiter
      await asyncForEach(jobs, async (job) => {
        if (job.job_rythm === "1 jours / 4 jours") {
          job.job_rythm = TRAINING_RYTHM["1J4J"]
        }
        await updateOffre(job._id, { ...job })
      })
      stats.success++
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject,
    message: `${stats.failure} erreurs. ${stats.success} mises à jour`,
    error: stats.failure > 0,
  })
  return stats
}

export const fixRecruiterDataValidation = async () => {
  await fixDates()
  await fixJobRythm()
}
