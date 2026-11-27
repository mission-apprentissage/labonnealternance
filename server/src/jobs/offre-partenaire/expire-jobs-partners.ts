import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { getWorkplaceDisplayName } from "shared/utils/company-display-name"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/async-utils"
import { getEmailLogos } from "@/common/utils/email-logos"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { sanitizeTextField } from "@/common/utils/string-utils"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/access-token.service"
import { createCancelJobLink } from "@/services/app-links.service"
import { changeJobsPartnersStatus, JOB_AUTO_CLOSURE_ORIGIN, JOB_PENDING_EXPIRATION_ORIGIN } from "@/services/job-partner-status.service"
import mailer from "@/services/mailer.service"

const getReminderCompanyName = (job: Pick<IJobsPartnersOfferPrivate, "workplace_name" | "workplace_brand" | "workplace_legal_name">) => getWorkplaceDisplayName(job) ?? ""

const sendExpirationEmails = async (expiredJobs: IJobsPartnersOfferPrivate[]) => {
  // Seules les offres gérées par LBA (managed_by renseigné) reçoivent le mail de clôture automatique.
  const managedExpiredJobs = expiredJobs.filter((job) => job.managed_by)
  if (!managedExpiredJobs.length) {
    return
  }

  const groupByUserOffres = groupBy(managedExpiredJobs, (job) => job.managed_by?.toString())

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
      const contactUser = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
      if (!contactUser) {
        throw new Error(`impossible de trouver l'utilisateur gérant l'offre avec id=${firstJob._id}`)
      }

      await mailer.sendEmail({
        to: contactUser.email,
        subject: "Votre offre d'alternance a expiré",
        template: getStaticFilePath("./templates/mail-offre-expiree-auto.mjml.ejs"),
        data: {
          images: getEmailLogos(),
          last_name: sanitizeTextField(contactUser.last_name),
          first_name: sanitizeTextField(contactUser.first_name),
          establishment_raison_sociale: getReminderCompanyName(firstJob),
          offres: jobsGroup.map((job) => ({
            job_title: job.offer_title,
            cloturer: createCancelJobLink(userWithAccountToUserForToken(contactUser), job._id.toString()),
          })),
          publicEmail: config.publicEmail,
        },
      })
    } catch (err) {
      logger.error(err)
      logger.error(`expireJobsPartners: envoi du mail d'expiration, offre id=${firstJob?._id}, erreur`)
      sentryCaptureException(err)
    }
  })
}

export const expireJobsPartners = async () => {
  const now = new Date()
  const expired = { offer_expiration: { $lt: now } }
  const reason = `${JOB_PARTNER_BUSINESS_ERROR.EXPIRED} (date dépassée)`

  // Lues avant le flip de statut, pour le mail de clôture automatique (cf. sendExpirationEmails). Le mail annonce
  // que l'offre n'est plus visible : une offre en modération ou en attente ne l'était pas.
  const expiringActiveJobs = await getDbCollection("jobs_partners")
    .find({ ...expired, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    .toArray()

  // Une offre en modération sans décision expire à sa date, comme une offre publiée (#5499).
  const published = await changeJobsPartnersStatus(
    { ...expired, offer_status: { $in: [JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_MODERATION] } },
    { status: JOB_STATUS_ENGLISH.ANNULEE, reason, grantedBy: JOB_AUTO_CLOSURE_ORIGIN.EXPIRATION, date: now }
  )
  const pending = await changeJobsPartnersStatus(
    { ...expired, offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE },
    { status: JOB_STATUS_ENGLISH.ANNULEE, reason, grantedBy: JOB_PENDING_EXPIRATION_ORIGIN, date: now }
  )
  logger.info(`expireJobsPartners: ${published.modifiedCount} offres expirées, ${pending.modifiedCount} offres en attente expirées`)

  await sendExpirationEmails(expiringActiveJobs)
}
