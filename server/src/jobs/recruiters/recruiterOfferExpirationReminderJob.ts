import { internal } from "@hapi/boom"
import { groupBy } from "lodash-es"
import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOB_STATUS_ENGLISH } from "shared/models/index"

import dayjs from "shared/helpers/dayjs"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { sanitizeTextField } from "@/common/utils/stringUtils"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { createAuthMagicLink, createCancelJobLink, createProvidedJobLink } from "@/services/appLinks.service"
import mailer from "@/services/mailer.service"

export const recruiterOfferExpirationReminderJob = async (numberOfDaysToExpirationDate: number /* number of days to expiration for the reminder email to be sent */) => {
  const dateRelanceFieldName = numberOfDaysToExpirationDate === 1 ? "relance_mail_expiration_J1" : numberOfDaysToExpirationDate === 7 ? "relance_mail_expiration_J7" : null
  const additionalFilter: Filter<IJobsPartnersOfferPrivate> = {}
  if (dateRelanceFieldName) {
    additionalFilter[dateRelanceFieldName] = null
  }
  const now = new Date()
  let jobs = await getDbCollection("jobs_partners")
    .find({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      offer_expiration: { $gt: now },
      ...additionalFilter,
    })
    .toArray()

  jobs = jobs.filter((job) => {
    const { offer_status, offer_expiration } = job
    const remainingDays = dayjs(offer_expiration).diff(dayjs(), "days")
    return offer_status === JOB_STATUS_ENGLISH.ACTIVE && remainingDays === numberOfDaysToExpirationDate && (!dateRelanceFieldName || !job[dateRelanceFieldName])
  })

  const nbOffres = jobs.length
  if (nbOffres <= 0) {
    logger.info("Aucune offre à relancer aujourd'hui.")
    await notifyToSlack({ subject: `RELANCE J+${numberOfDaysToExpirationDate}`, message: `Aucune relance à effectuer.` })
    return
  }

  const groupByUserOffres = groupBy(jobs, (job) => job.managed_by)

  logger.info(`${nbOffres} offres relancé aujourd'hui.`)
  await notifyToSlack({
    subject: `RELANCE J+${numberOfDaysToExpirationDate}`,
    message: `*${nbOffres} offres* (${Object.keys(groupByUserOffres).length} users) ont été relancés.`,
  })

  await asyncForEach(Object.values(groupByUserOffres), async (jobsGroup) => {
    const firstJob = jobsGroup.at(0)
    try {
      if (!firstJob) {
        throw new Error("inattendu: groupe vide")
      }
      const { managed_by } = firstJob
      if (!managed_by) {
        throw new Error(`managed_by vide pour l'offre avec id=${firstJob._id}`)
      }
      const { is_delegated, workplace_name } = firstJob
      const contactUser = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
      if (!contactUser) {
        throw internal(`inattendu : impossible de trouver l'utilisateur gérant l'offre avec id=${firstJob._id}`)
      }

      const subject = `Votre offre expire ${numberOfDaysToExpirationDate === 1 ? "demain" : `dans ${numberOfDaysToExpirationDate} jours`}`

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
          last_name: sanitizeTextField(contactUser.last_name),
          first_name: sanitizeTextField(contactUser.first_name),
          establishment_raison_sociale: workplace_name,
          is_delegated,
          offres: jobsGroup.map((job) => ({
            job_title: job.offer_title,
            rome_appellation_label: job.offer_rome_appellation,
            job_type: job.contract_type.join(", "),
            job_level_label: job.offer_target_diploma?.label,
            job_start_date: dayjs(job.contract_start).format("DD/MM/YYYY"),
            supprimer: createCancelJobLink(userWithAccountToUserForToken(contactUser), job._id.toString(), LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
            pourvue: createProvidedJobLink(userWithAccountToUserForToken(contactUser), job._id.toString(), LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
          })),
          threshold: numberOfDaysToExpirationDate,
          connectionUrl: createAuthMagicLink(userWithAccountToUserForToken(contactUser)),
          publicEmail: config.publicEmail,
        },
      })
      if (dateRelanceFieldName) {
        await getDbCollection("jobs_partners").updateMany(
          {
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            _id: { $in: jobsGroup.map((job) => job._id) },
          },
          {
            $set: {
              [dateRelanceFieldName]: now,
            },
          }
        )
      }
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
      logger.error(err)
      logger.error(`Script de relance formulaire: offre id=${firstJob?._id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
    }
  })
}
