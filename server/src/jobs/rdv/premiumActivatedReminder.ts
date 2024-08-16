import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { isValidEmail } from "../../common/utils/isValidEmail"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import mailer from "../../services/mailer.service"

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

  for (const etablissement of etablissementWithParcoursup) {
    // Retrieve all emails
    let emails = eligibleTrainingsForAppointmentsFound.flatMap((eligibleTrainingsForAppointment) => {
      if (eligibleTrainingsForAppointment.etablissement_formateur_siret === etablissement.formateur_siret) {
        const email = eligibleTrainingsForAppointment.lieu_formation_email
        return email ? [email] : []
      } else {
        return []
      }
    })

    if (etablissement.gestionnaire_email) {
      emails.push(etablissement.gestionnaire_email)
    }
    emails = [...new Set(emails)]

    for (const email of emails) {
      try {
        if (!isValidEmail(email)) {
          logger.info("Invalid email syntax.", { email, etablissement })
          continue
        }

        await mailer.sendEmail({
          to: email,
          subject: `Rappel - Les jeunes peuvent prendre contact avec votre CFA sur Parcoursup`,
          template: getStaticFilePath("./templates/mail-cfa-premium-activated-reminder.mjml.ejs"),
          data: {
            url: config.publicUrl,
            replyTo: config.publicEmail,
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
              logoParcoursup: `${config.publicUrl}/assets/logo-parcoursup.png?raw=true`,
              logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
              peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
              integrationExample: `${config.publicUrl}/assets/exemple_integration_parcoursup.jpg?raw=true`,
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

        await getDbCollection("etablissements").updateOne(
          { formateur_siret: etablissement.formateur_siret },
          {
            $set: {
              premium_invitation_date: dayjs().toDate(),
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
