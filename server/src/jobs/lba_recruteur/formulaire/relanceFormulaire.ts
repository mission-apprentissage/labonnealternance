import { internal } from "@hapi/boom"
import { groupBy } from "lodash-es"
import { ObjectId } from "mongodb"
import { JOB_STATUS } from "shared/models"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { createAuthMagicLink, createCancelJobLink, createProvidedJobLink } from "@/services/appLinks.service"

import { logger } from "../../../common/logger"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import { notifyToSlack } from "../../../common/utils/slackUtils"
import config from "../../../config"
import dayjs from "../../../services/dayjs.service"
import mailer, { sanitizeForEmail } from "../../../services/mailer.service"

export const relanceFormulaire = async (threshold: number /* number of days to expiration for the reminder email to be sent */) => {
  const recruiters = await getDbCollection("recruiters")
    .find({
      $nor: [{ jobs: { $exists: false } }, { jobs: { $size: 0 } }],
      "jobs.job_status": JOB_STATUS.ACTIVE,
    })
    .toArray()

  const jobsWithRecruteurs = recruiters.flatMap((recruiter) => {
    return recruiter.jobs.flatMap((job) => {
      const remainingDays = dayjs(job.job_expiration_date).diff(dayjs(), "days")
      if (job.job_status === JOB_STATUS.ACTIVE && remainingDays === threshold) {
        return [{ ...job, recruiter }]
      } else {
        return []
      }
    })
  })

  const nbOffres = jobsWithRecruteurs.length
  if (nbOffres === 0) {
    logger.info("Aucune offre à relancer aujourd'hui.")
    await notifyToSlack({ subject: `RELANCE J+${threshold}`, message: `Aucune relance à effectuer.` })
    return
  }

  const groupByRecruiterOffres = groupBy(jobsWithRecruteurs, (job) => job.recruiter._id.toString())

  if (nbOffres > 0) {
    logger.info(`${nbOffres} offres relancé aujourd'hui.`)
    await notifyToSlack({ subject: `RELANCE J+${threshold}`, message: `*${nbOffres} offres* (${Object.keys(groupByRecruiterOffres).length} formulaires) ont été relancés.` })
  }

  await asyncForEach(Object.values(groupByRecruiterOffres), async (jobsWithRecruiter) => {
    const recruiter = jobsWithRecruiter[0].recruiter
    const { establishment_raison_sociale, is_delegated } = recruiter
    try {
      const { managed_by } = recruiter.jobs[0]
      if (!managed_by) {
        throw internal(`inattendu : managed_by manquant pour le formulaire id=${recruiter._id}`)
      }
      const contactUser = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
      if (!contactUser) {
        throw internal(`inattendu : impossible de trouver l'utilisateur gérant le formulaire id=${recruiter._id}`)
      }

      await mailer.sendEmail({
        to: contactUser.email,
        subject: "Vos offres expirent bientôt",
        template: getStaticFilePath("./templates/mail-expiration-offres.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          },
          last_name: sanitizeForEmail(contactUser.last_name),
          first_name: sanitizeForEmail(contactUser.first_name),
          establishment_raison_sociale,
          is_delegated,
          offres: jobsWithRecruiter.map((job) => ({
            rome_appellation_label: job.rome_appellation_label ?? job.rome_label,
            job_type: job.job_type,
            job_level_label: job.job_level_label,
            job_start_date: dayjs(job.job_start_date).format("DD/MM/YYYY"),
            supprimer: createCancelJobLink(userWithAccountToUserForToken(contactUser), job._id.toString()),
            pourvue: createProvidedJobLink(userWithAccountToUserForToken(contactUser), job._id.toString()),
          })),
          threshold,
          connectionUrl: createAuthMagicLink(userWithAccountToUserForToken(contactUser)),
        },
      })
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
      logger.error(err)
      logger.error(`Script de relance formulaire: recruiter id=${recruiter._id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
    }
  })
}
