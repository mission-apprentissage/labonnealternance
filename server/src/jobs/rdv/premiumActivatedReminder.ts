import dayjs from "shared/helpers/dayjs"
import { logger } from "@/common/logger"
import { isValidEmail } from "@/common/utils/isValidEmail"
import config from "@/config"
import * as eligibleTrainingsForAppointmentService from "@/services/eligibleTrainingsForAppointment.service"
import mailer from "@/services/mailer.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

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
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
              logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
              logoParcoursup: `${config.publicUrl}/images/emails/logo_parcoursup.png`,
              optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
            },
            etablissement: {
              name: etablissement.raison_sociale,
              formateur_address: etablissement.formateur_address,
              formateur_zip_code: etablissement.formateur_zip_code,
              formateur_city: etablissement.formateur_city,
              siret: etablissement.formateur_siret,
              premiumActivatedDate: dayjs(etablissement.premium_activation_date).format("DD/MM/YYYY"),
            },
            publicEmail: config.publicEmail,
            utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-premium-rappel-annuel",
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
