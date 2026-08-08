import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { sanitizeTextField } from "@/common/utils/stringUtils"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/access-token.service"
import { createCancelJobLink } from "@/services/appLinks.service"
import { getApplicationByJobCount } from "@/services/application.service"
import mailer from "@/services/mailer.service"

const APPLICATION_COUNT_THRESHOLD = 80

const getReminderCompanyName = ({
  workplace_name,
  workplace_brand,
  workplace_legal_name,
}: Pick<IJobsPartnersOfferPrivate, "workplace_name" | "workplace_brand" | "workplace_legal_name">) => {
  return workplace_name ?? workplace_brand ?? workplace_legal_name ?? ""
}

const sendThresholdEmails = async (closedJobs: IJobsPartnersOfferPrivate[]) => {
  const managedClosedJobs = closedJobs.filter((job) => job.managed_by)
  if (!managedClosedJobs.length) {
    return
  }

  const groupByUserOffres = groupBy(managedClosedJobs, (job) => job.managed_by?.toString())

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
        subject: "Votre offre d'alternance a été dépubliée",
        template: getStaticFilePath("./templates/mail-offre-seuil-candidatures.mjml.ejs"),
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
      logger.error(`closeJobsPartnersOnApplicationThreshold: envoi du mail de seuil, offre id=${firstJob?._id}, erreur`)
      sentryCaptureException(err)
    }
  })
}

/**
 * @description Clôture automatiquement les offres LBA actives ayant atteint un nombre élevé de candidatures
 * (seuil au-delà duquel on considère que le recruteur n'a plus besoin de nouvelles candidatures),
 * et notifie le recruteur par mail avec un lien vers le formulaire de clôture de recrutement.
 */
export const closeJobsPartnersOnApplicationThreshold = async (payload?: { threshold?: string | number }) => {
  // threshold configurable (CLI --threshold, défaut 80) : permet de tester en preview sans avoir
  // à créer 80 candidatures réelles sur une offre.
  const threshold = payload?.threshold !== undefined ? Number(payload.threshold) : APPLICATION_COUNT_THRESHOLD

  const activeJobs = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status: JOB_STATUS_ENGLISH.ACTIVE }).toArray()

  if (!activeJobs.length) {
    logger.info("closeJobsPartnersOnApplicationThreshold: aucune offre active à vérifier.")
    return
  }

  const applicationCounts = await getApplicationByJobCount(activeJobs.map((job) => job._id))
  const countByJobId = new Map(applicationCounts.map((appCount) => [appCount._id, appCount.count]))

  const jobsToClose = activeJobs.filter((job) => (countByJobId.get(job._id.toString()) ?? 0) >= threshold)

  if (!jobsToClose.length) {
    logger.info(`closeJobsPartnersOnApplicationThreshold: aucune offre n'a atteint le seuil de ${threshold} candidatures.`)
    return
  }

  const now = new Date()
  const closedJobs: IJobsPartnersOfferPrivate[] = []

  await asyncForEach(jobsToClose, async (job) => {
    const found = await getDbCollection("jobs_partners").findOneAndUpdate(
      { _id: job._id },
      {
        $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now },
        $push: {
          offer_status_history: {
            date: now,
            status: JOB_STATUS_ENGLISH.ANNULEE,
            reason: `seuil de ${threshold} candidatures atteint`,
            granted_by: "closeJobsPartnersOnApplicationThreshold",
          },
        },
      },
      { returnDocument: "after" }
    )
    if (found) {
      closedJobs.push(found)
    }
  })

  logger.info(`closeJobsPartnersOnApplicationThreshold: ${closedJobs.length} offres clôturées (seuil de ${threshold} candidatures atteint)`)

  await sendThresholdEmails(closedJobs)
}
