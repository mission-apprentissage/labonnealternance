import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { sanitizeTextField } from "@/common/utils/stringUtils"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/access-token.service"
import { createCancelJobLink } from "@/services/appLinks.service"
import mailer from "@/services/mailer.service"

const getReminderCompanyName = ({
  workplace_name,
  workplace_brand,
  workplace_legal_name,
}: Pick<IJobsPartnersOfferPrivate, "workplace_name" | "workplace_brand" | "workplace_legal_name">) => {
  return workplace_name ?? workplace_brand ?? workplace_legal_name ?? ""
}

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
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
          },
          last_name: sanitizeTextField(contactUser.last_name),
          first_name: sanitizeTextField(contactUser.first_name),
          establishment_raison_sociale: getReminderCompanyName(firstJob),
          offres: jobsGroup.map((job) => ({
            job_title: job.offer_title,
            cloturer: createCancelJobLink(userWithAccountToUserForToken(contactUser), job._id.toString(), LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
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
  const filter = { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_expiration: { $lt: now } }

  // On récupère les offres AVANT le flip de statut pour pouvoir envoyer le mail de clôture automatique
  // aux recruteurs gérés par LBA (managed_by renseigné), sans changer le filtre du updateMany ci-dessous.
  const expiringJobs = await getDbCollection("jobs_partners").find(filter).toArray()

  const result = await getDbCollection("jobs_partners").updateMany(filter, {
    // updated_at : requis par le cron delta search_items (syncSearchItemsDelta).
    $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now },
    $push: {
      offer_status_history: {
        date: now,
        status: JOB_STATUS_ENGLISH.ANNULEE,
        reason: "offre expirée (date dépassée)",
        granted_by: "expireJobsPartners",
      },
    },
  })
  logger.info(`expireJobsPartners: ${result.modifiedCount} offres expirées`)

  await sendExpirationEmails(expiringJobs)
}
