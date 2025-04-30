import { internal } from "@hapi/boom"
import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IJob, JOB_STATUS } from "shared/models/index"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { removeHtmlTagsFromString } from "@/common/utils/stringUtils"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { createAuthMagicLink, createCancelJobLink, createProvidedJobLink } from "@/services/appLinks.service"
import dayjs from "@/services/dayjs.service"
import mailer from "@/services/mailer.service"

export const recruiterOfferExpirationReminderJob = async (numberOfDaysToExpirationDate: number /* number of days to expiration for the reminder email to be sent */) => {
  const dateRelanceFieldName = numberOfDaysToExpirationDate === 1 ? "relance_mail_expiration_J1" : numberOfDaysToExpirationDate === 7 ? "relance_mail_expiration_J7" : null
  const additionalFilter = {}
  if (dateRelanceFieldName) {
    additionalFilter[`jobs.${dateRelanceFieldName}`] = null
  }
  const now = new Date()
  const recruiters = await getDbCollection("recruiters")
    .find({
      "jobs.job_status": JOB_STATUS.ACTIVE,
      "jobs.job_expiration_date": { $gt: now },
      ...additionalFilter,
    })
    .toArray()

  const jobsWithRecruteurs = recruiters.flatMap((recruiter) => {
    return recruiter.jobs.flatMap((job) => {
      const { job_status, job_expiration_date } = job
      const remainingDays = dayjs(job_expiration_date).diff(dayjs(), "days")
      if (job_status === JOB_STATUS.ACTIVE && remainingDays === numberOfDaysToExpirationDate && (!dateRelanceFieldName || !job[dateRelanceFieldName])) {
        return [{ ...job, recruiter }]
      } else {
        return []
      }
    })
  })

  const nbOffres = jobsWithRecruteurs.length
  if (nbOffres === 0) {
    logger.info("Aucune offre à relancer aujourd'hui.")
    await notifyToSlack({ subject: `RELANCE J+${numberOfDaysToExpirationDate}`, message: `Aucune relance à effectuer.` })
    return
  }

  const groupByRecruiterOffres = groupBy(jobsWithRecruteurs, (job) => job.recruiter._id.toString())

  if (nbOffres > 0) {
    logger.info(`${nbOffres} offres relancé aujourd'hui.`)
    await notifyToSlack({
      subject: `RELANCE J+${numberOfDaysToExpirationDate}`,
      message: `*${nbOffres} offres* (${Object.keys(groupByRecruiterOffres).length} formulaires) ont été relancés.`,
    })
  }

  await asyncForEach(Object.values(groupByRecruiterOffres), async (jobsWithRecruiter) => {
    const recruiter = jobsWithRecruiter[0].recruiter
    const { establishment_raison_sociale, is_delegated, managed_by } = recruiter
    try {
      if (!managed_by) {
        throw internal(`inattendu : managed_by manquant pour le formulaire id=${recruiter._id}`)
      }
      const contactUser = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
      if (!contactUser) {
        throw internal(`inattendu : impossible de trouver l'utilisateur gérant le formulaire id=${recruiter._id}`)
      }

      const subject = `${jobsWithRecruiter.length > 1 ? "Vos offres expirent" : "Votre offre expire"} ${numberOfDaysToExpirationDate === 1 ? "demain" : `dans ${numberOfDaysToExpirationDate} jours`}`

      await mailer.sendEmail({
        to: contactUser.email,
        subject,
        template: getStaticFilePath("./templates/mail-expiration-offres.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
          },
          last_name: removeHtmlTagsFromString(contactUser.last_name),
          first_name: removeHtmlTagsFromString(contactUser.first_name),
          establishment_raison_sociale,
          is_delegated,
          offres: jobsWithRecruiter.map((job) => ({
            job_title: job.offer_title_custom,
            rome_appellation_label: job.rome_appellation_label ?? job.rome_label,
            job_type: job.job_type,
            job_level_label: job.job_level_label,
            job_start_date: dayjs(job.job_start_date).format("DD/MM/YYYY"),
            supprimer: createCancelJobLink(userWithAccountToUserForToken(contactUser), job._id.toString(), LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
            pourvue: createProvidedJobLink(userWithAccountToUserForToken(contactUser), job._id.toString(), LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
          })),
          threshold: numberOfDaysToExpirationDate,
          connectionUrl: createAuthMagicLink(userWithAccountToUserForToken(contactUser)),
        },
      })
      if (dateRelanceFieldName) {
        const jobUpdate: Partial<IJob> = {}
        jobUpdate[`jobs.$[elem].${dateRelanceFieldName}`] = now
        await asyncForEach(jobsWithRecruiter, async (job) => {
          await getDbCollection("recruiters").findOneAndUpdate({ "jobs._id": job._id }, { $set: jobUpdate }, { arrayFilters: [{ "elem._id": job._id }] })
        })
      }
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
      logger.error(err)
      logger.error(`Script de relance formulaire: recruiter id=${recruiter._id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
    }
  })
}
