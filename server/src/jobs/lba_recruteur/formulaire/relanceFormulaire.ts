import { groupBy } from "lodash-es"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import { notifyToSlack } from "../../../common/utils/slackUtils"
import config from "../../../config"
import dayjs from "../../../services/dayjs.service"
import mailer from "../../../services/mailer.service"

export const relanceFormulaire = async (threshold: number /* number of days to expiration for the reminder email to be sent */) => {
  const recruiters = await Recruiter.find({
    $nor: [{ jobs: { $exists: false } }, { jobs: { $size: 0 } }],
    "jobs.job_status": "Active",
  }).lean()

  const jobsWithRecruteurs = recruiters.flatMap((recruiter) => {
    return recruiter.jobs.flatMap((job) => {
      const remainingDays = dayjs(job.job_expiration_date).diff(dayjs(), "days")
      if (job.job_status === "Active" && remainingDays === threshold) {
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
    const { email, establishment_raison_sociale, last_name, first_name, is_delegated, cfa_delegated_siret } = recruiter
    let contactCFA
    // get CFA informations if formulaire is handled by a CFA
    if (is_delegated && cfa_delegated_siret) {
      contactCFA = await UserRecruteur.findOne({ establishment_siret: cfa_delegated_siret })
    }

    await mailer.sendEmail({
      to: contactCFA?.email ?? email,
      subject: "Vos offres expirent bientôt",
      template: getStaticFilePath("./templates/mail-expiration-offres.mjml.ejs"),
      data: {
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
        },
        last_name: contactCFA?.last_name ?? last_name,
        first_name: contactCFA?.first_name ?? first_name,
        establishment_raison_sociale,
        is_delegated,
        offres: jobsWithRecruiter.map((job) => ({
          libelle: job.rome_appellation_label ?? job.rome_label,
          type: job.job_type,
          supprimer: `${config.publicUrl}/espace-pro/job/${job._id}/cancel`,
          pourvue: `${config.publicUrl}/espace-pro/job/${job._id}/provided`,
        })),
        threshold,
        url: `${config.publicUrl}/espace-pro/authentification`,
      },
    })
  })
}
