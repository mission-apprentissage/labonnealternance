import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/async-utils"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { sanitizeTextField } from "@/common/utils/string-utils"
import config from "@/config"
import { userWithAccountToUserForToken } from "@/security/access-token.service"
import { createCancelJobLink } from "@/services/app-links.service"
import { buildJobStatusChangeUpdate, JOB_AUTO_CLOSURE_ORIGIN } from "@/services/job-partner-status.service"
import mailer from "@/services/mailer.service"
import { syncJobPartnersToSearchItemsInBackground } from "@/services/search/search-items.service"

/** Nombre de candidatures à partir duquel on considère que le recruteur n'a plus besoin d'en recevoir. */
export const APPLICATION_COUNT_THRESHOLD = 80

export const buildApplicationThresholdReason = (threshold: number) => `seuil de ${threshold} candidatures atteint`

const getReminderCompanyName = ({
  workplace_name,
  workplace_brand,
  workplace_legal_name,
}: Pick<IJobsPartnersOfferPrivate, "workplace_name" | "workplace_brand" | "workplace_legal_name">) => {
  // `||` et non `??` : workplace_name peut valoir "" (cf. formatTextFieldsJobsPartners).
  return workplace_name || workplace_brand || workplace_legal_name || ""
}

const sendThresholdEmails = async (closedJobs: IJobsPartnersOfferPrivate[]) => {
  // Le lien de clôture du mail ne vaut que pour une offre LBA, gérée par un compte de l'espace pro.
  const managedClosedJobs = closedJobs.filter((job) => job.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA && job.managed_by)
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
      logger.error(`closeJobsOnApplicationThreshold: envoi du mail de seuil, offre id=${firstJob?._id}, erreur`)
      sentryCaptureException(err)
    }
  })
}

/**
 * Seul point de clôture au seuil de candidatures, appelé au dépôt de la candidature qui atteint le
 * seuil et par le cron closeJobsPartnersOnApplicationThreshold, qui rattrape les offres manquées.
 *
 * Le filtre sur ACTIVE rend l'appel idempotent : une offre déjà close par l'autre déclencheur n'est
 * ni tracée deux fois ni notifiée deux fois. Seules les offres LBA reçoivent le mail ; les offres
 * partenaires sont fermées sur LBA sans notification, leur recruteur n'ayant pas de compte.
 */
export const closeJobsOnApplicationThreshold = async (jobIds: ObjectId[], threshold: number = APPLICATION_COUNT_THRESHOLD): Promise<IJobsPartnersOfferPrivate[]> => {
  const now = new Date()
  const closedJobs: IJobsPartnersOfferPrivate[] = []

  await asyncForEach(jobIds, async (_id) => {
    const found = await getDbCollection("jobs_partners").findOneAndUpdate(
      { _id, offer_status: JOB_STATUS_ENGLISH.ACTIVE },
      buildJobStatusChangeUpdate({
        status: JOB_STATUS_ENGLISH.ANNULEE,
        reason: buildApplicationThresholdReason(threshold),
        grantedBy: JOB_AUTO_CLOSURE_ORIGIN.APPLICATION_THRESHOLD,
        date: now,
      }),
      { returnDocument: "after" }
    )
    if (found) {
      closedJobs.push(found)
    }
  })

  if (closedJobs.length) {
    syncJobPartnersToSearchItemsInBackground(closedJobs.map(({ _id }) => _id))
  }
  await sendThresholdEmails(closedJobs)
  return closedJobs
}
