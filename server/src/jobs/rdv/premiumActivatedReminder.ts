import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../db/constants/etablissement.js"
import dayjs from "../../services/dayjs.service.js"
import config from "../../config.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service.js"
import { Etablissement } from "../../db/index.js"
import mailer from "../../services/mailer.service.js"

/**
 * @description Send a "Premium" reminder mail.
 * @returns {Promise<void>}
 */
export const premiumActivatedReminder = async () => {
  logger.info("Cron #premiumActivatedReminder started.")

  const [etablissementsActivated, eligibleTrainingsForAppointmentsFound] = await Promise.all([
    Etablissement.find({
      gestionnaire_email: {
        $ne: null,
      },
      premium_activation_date: {
        $ne: null,
      },
    }).lean(),
    eligibleTrainingsForAppointmentService.find({ parcoursup_id: { $ne: null }, lieu_formation_email: { $ne: null } }).lean(),
  ])

  const etablissementWithParcoursup = etablissementsActivated.filter((etablissement) =>
    eligibleTrainingsForAppointmentsFound.find((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.etablissement_formateur_siret === etablissement.formateur_siret)
  )

  for (const etablissement of etablissementWithParcoursup) {
    // Retrieve all emails
    let emails = eligibleTrainingsForAppointmentsFound
      .filter((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.etablissement_formateur_siret === etablissement.formateur_siret)
      .map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
      .concat([etablissement.gestionnaire_email])
    emails = [...new Set(emails)].filter((email) => email)

    for (const email of emails) {
      try {
        if (!isValidEmail) {
          logger.info("Invalid email syntax.", { email, etablissement })
          continue
        }

        const { messageId } = await mailer.sendEmail({
          to: email,
          subject: `Rappel - Les jeunes peuvent prendre contact avec votre CFA sur Parcoursup`,
          template: mailTemplate["mail-cfa-premium-activated-reminder"],
          data: {
            url: config.publicUrl,
            replyTo: config.publicEmail,
            images: {
              logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
              logoParcoursup: `${config.publicUrlEspacePro}/assets/logo-parcoursup.png?raw=true`,
              logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
              peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
              integrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_parcoursup.jpg?raw=true`,
            },
            etablissement: {
              name: etablissement.raison_sociale,
              formateur_address: etablissement.formateur_address,
              formateur_zip_code: etablissement.formateur_zip_code,
              formateur_city: etablissement.formateur_city,
              siret: etablissement.formateur_siret,
              email: etablissement.gestionnaire_email,
              premiumActivatedDate: dayjs(etablissement.premium_activation_date).format("DD/MM/YYYY"),
              emailGestionnaire: etablissement.gestionnaire_email,
            },
            user: {
              destinataireEmail: email,
            },
          },
        })

        await Etablissement.updateOne(
          { formateur_siret: etablissement.formateur_siret },
          {
            premium_invitation_date: dayjs().toDate(),
            $push: {
              to_etablissement_emails: {
                campaign: mailType.PREMIUM_ACTIVATED_REMINDER,
                status: null,
                message_id: messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
          }
        )
      } catch (error) {
        logger.error(error)
      }
    }
  }

  logger.info("Cron #premiumActivatedReminder done.")
}
