import { IRecruiter } from "shared"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import { notifyToSlack } from "../../../common/utils/slackUtils"
import config from "../../../config"
import dayjs from "../../../services/dayjs.service"
import mailer from "../../../services/mailer.service"

export const relanceFormulaire = async (threshold) => {
  // number of days to expiration for the reminder email to be sent

  const forms = await Recruiter.find({
    $nor: [{ jobs: { $exists: false } }, { jobs: { $size: 0 } }],
    "jobs.job_status": "Active",
  }).lean()

  // reduce formulaire with eligible offers
  const format = forms.reduce((acc, formulaire) => {
    acc[`${formulaire._id}`] = { ...formulaire, offres: [] }

    formulaire.jobs
      // The query returns all offers included in the form, regardless of the status filter in the query.
      // The payload is smaller than not filtering it.
      .filter((x) => x.job_status === "Active")
      .forEach((job) => {
        const remainingDays = dayjs(job.job_expiration_date).diff(dayjs(), "days")

        // if the number of days to the expiration date is strictly above the threshold, do nothing
        if (remainingDays !== threshold) return

        acc[`${formulaire._id}`].jobs.push({
          ...job,
          supprimer: `${config.publicUrl}/espace-pro/job/${job._id}/cancel`,
          pourvue: `${config.publicUrl}/espace-pro/job/${job._id}/provided`,
        })
      })
    return acc
  }, {})

  // format array and remove formulaire without offers
  const formulaireToExpire = Object.values<IRecruiter>(format).filter((x: any) => x.jobs.length !== 0)

  if (formulaireToExpire.length === 0) {
    logger.info("Aucune offre à relancer aujourd'hui.")
    await notifyToSlack({ subject: `RELANCE J+${threshold}`, message: `Aucune relance à effectuer.` })
    return
  }

  const nbOffres = formulaireToExpire.reduce((acc: number, formulaire: any) => (acc += formulaire.jobs.length), 0)

  if (nbOffres > 0) {
    logger.info(`${nbOffres} offres relancé aujourd'hui.`)
    await notifyToSlack({ subject: `RELANCE J+${threshold}`, message: `*${nbOffres} offres* (${formulaireToExpire.length} formulaires) ont été relancés.` })
  }

  await asyncForEach(formulaireToExpire, async (formulaire: IRecruiter) => {
    const { email, establishment_raison_sociale, last_name, first_name, jobs, is_delegated, cfa_delegated_siret } = formulaire
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
        offres: jobs,
        threshold,
        url: `${config.publicUrl}/espace-pro/authentification`,
      },
    })
  })
}
