import Boom from "boom"
import { TRAINING_RYTHM } from "shared/constants/recruteur"
import { z } from "zod"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { updateOffre } from "@/services/formulaire.service"
import { getRomeDetailsFromDB } from "@/services/rome.service"

const fixDates = async () => {
  const subject = "Fix data validations pour recruiters : delegations.cfa_read_company_detail_at"
  const recruiters = await getDbCollection("recruiters")
    .find({
      "jobs.delegations.cfa_read_company_detail_at": { $type: "string" },
    })
    .toArray()
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

const fixRomeDetails = async () => {
  const subject = "Fix data validations pour recruiters : rome_detail"
  const recruiters = await getDbCollection("recruiters")
    .find({
      "jobs.rome_detail": { $type: "string" },
    })
    .toArray()
  const stats = { success: 0, failure: 0 }
  logger.info(`${subject}: ${recruiters.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruiters, async (recruiter) => {
    try {
      logger.info("treating recruiter", recruiter._id)
      const { jobs } = recruiter
      await asyncForEach(jobs, async (job) => {
        const { rome_detail, rome_code } = job
        if (rome_detail && typeof rome_detail === "string") {
          const romeData = await getRomeDetailsFromDB(rome_code[0])
          if (!romeData) {
            throw Boom.internal(`could not find rome infos for rome=${rome_code}`)
          }
          job.rome_detail = romeData
        }
        await updateOffre(job._id, { ...job })
      })
      stats.success++
    } catch (err) {
      logger.error(err)
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
  const recruiters = await getDbCollection("recruiters")
    .find({
      $or: [
        {
          "jobs.job_rythm": "1 jours / 4 jours",
        },
        {
          "jobs.job_rythm": "",
        },
      ],
    })
    .toArray()
  const stats = { success: 0, failure: 0 }
  logger.info(`${subject}: ${recruiters.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruiters, async (recruiter) => {
    try {
      const { jobs } = recruiter
      await asyncForEach(jobs, async (job) => {
        if (job.job_rythm === "1 jours / 4 jours") {
          job.job_rythm = TRAINING_RYTHM["1J4J"]
        } else if (job.job_rythm === "" || job.job_rythm === "Non renseigné") {
          job.job_rythm = null
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
  await fixRomeDetails()
  await fixDates()
  await fixJobRythm()
}
