// @ts-nocheck

import { mailTemplate } from "../../../assets/index"
import { logger } from "../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../common/model/index"
import { IRecruiter } from "../../../common/model/schema/recruiter/recruiter.types"
import { IUserRecruteur } from "../../../common/model/schema/userRecruteur/userRecruteur.types"
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
    acc[formulaire._id] = { ...formulaire, offres: [] }

    formulaire.jobs
      // The query returns all offers included in the form, regardless of the status filter in the query.
      // The payload is smaller than not filtering it.
      .filter((x) => x.job_status === "Active")
      .forEach((job) => {
        const remainingDays = dayjs(job.job_expiration_date).diff(dayjs(), "days")

        // if the number of days to the expiration date is strictly above the threshold, do nothing
        if (remainingDays !== threshold) return

        job.supprimer = `${config.publicUrlEspacePro}/job/${job._id}/cancel`
        job.pourvue = `${config.publicUrlEspacePro}/job/${job._id}/provided`

        acc[formulaire._id].jobs.push(job)
      })
    return acc
  }, {})

  // format array and remove formulaire without offers
  const formulaireToExpire = Object.values(format).filter((x: any) => x.jobs.length !== 0)

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

    // get CFA informations if formulaire is handled by a CFA
    const contactCFA: IUserRecruteur = is_delegated && (await UserRecruteur.findOne({ establishment_siret: cfa_delegated_siret }))

    await mailer.sendEmail({
      to: contactCFA?.email ?? email,
      subject: "Vos offres expirent bientôt",
      template: mailTemplate["mail-expiration-offres"],
      data: {
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
        },
        last_name: contactCFA?.last_name ?? last_name,
        first_name: contactCFA?.first_name ?? first_name,
        establishment_raison_sociale,
        is_delegated,
        jobs,
        threshold,
        url: `${config.publicUrlEspacePro}/authentification`,
      },
    })
  })
}
