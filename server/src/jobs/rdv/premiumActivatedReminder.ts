import { logger } from "@/common/logger"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import * as eligibleTrainingsForAppointmentService from "@/services/eligibleTrainingsForAppointment.service"
import mailer from "@/services/mailer.service"

/**
 * @description Send a "Premium" reminder mail.
 * @returns {Promise<void>}
 */
export const premiumActivatedReminder = async () => {
  logger.info("Cron #premiumActivatedReminder started.")

  const [etablissementsActivated, eligibleTrainingsForAppointmentsFound] = await Promise.all([
    getDbCollection("etablissements")
      .find({
        gestionnaire_email: {
          $ne: null,
        },
        premium_activation_date: {
          $ne: null,
        },
      })
      .toArray(),
    eligibleTrainingsForAppointmentService.find({ parcoursup_id: { $ne: null }, lieu_formation_email: { $ne: null } }),
  ])

  const etablissementWithParcoursup = etablissementsActivated.filter((etablissement) =>
    eligibleTrainingsForAppointmentsFound.find((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.etablissement_formateur_siret === etablissement.formateur_siret)
  )

  let targetedEmails: string[] = []

  for (const etablissement of etablissementWithParcoursup) {
    // Retrieve all emails
    let establishmentEmails = eligibleTrainingsForAppointmentsFound.flatMap((eligibleTrainingsForAppointment) => {
      if (eligibleTrainingsForAppointment.etablissement_formateur_siret === etablissement.formateur_siret) {
        const email = eligibleTrainingsForAppointment.lieu_formation_email
        return email ? [email] : []
      } else {
        return []
      }
    })

    establishmentEmails = [...new Set(establishmentEmails)]

    targetedEmails.push(...establishmentEmails)
  }

  targetedEmails = [...new Set(targetedEmails)]

  for (const email of targetedEmails) {
    try {
      await mailer.sendEmail({
        to: email,
        subject: "[Rappel] Trouvez et recrutez vos candidats sur Parcoursup avec La bonne alternance",
        template: getStaticFilePath("./templates/mail-cfa-premium-activated-reminder.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            logoParcoursup: `${config.publicUrl}/images/emails/logo_parcoursup.png`,
            optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
          },
          publicEmail: config.publicEmail,
          utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-premium-rappel-annuel",
        },
      })
    } catch (error) {
      logger.error(error)
    }
  }

  logger.info("Cron #premiumActivatedReminder done.")
}
