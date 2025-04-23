import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { createRdvaPremiumParcoursupPageLink } from "@/services/appLinks.service"

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
export const premiumInviteOneShot = async () => {
  logger.info("Cron #premiumInviteOneShot started.")

  const [etablissementsActivated, eligibleTrainingsForAppointmentsFound] = await Promise.all([
    getDbCollection("etablissements")
      .find({
        gestionnaire_email: {
          $ne: null,
        },
        optout_activation_date: {
          $ne: null,
        },
        premium_activation_date: null,
      })
      .toArray(),
    eligibleTrainingsForAppointmentService.find({ parcoursup_id: { $ne: null }, lieu_formation_email: { $ne: null } }),
  ])

  const etablissementWithParcoursup = etablissementsActivated.filter((etablissement) =>
    eligibleTrainingsForAppointmentsFound.find((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.etablissement_formateur_siret === etablissement.formateur_siret)
  )

  for (const etablissement of etablissementWithParcoursup) {
    try {
      const email = etablissement.gestionnaire_email
      if (!isValidEmail(email)) {
        logger.info("Invalid email syntax.", { etablissement })
        continue
      }

      if (!email) return
      if (!etablissement.gestionnaire_siret) return null

      await mailer.sendEmail({
        to: email,
        subject: `Trouvez et recrutez vos candidats sur Parcoursup`,
        template: getStaticFilePath("./templates/mail-cfa-premium-invite-one-shot.mjml.ejs"),
        data: {
          replyTo: config.publicEmail,
          url: config.publicUrl,
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoParcoursup: `${config.publicUrl}/assets/logo-parcoursup.webp?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.webp?raw=true`,
            peopleLaptop: `${config.publicUrl}/assets/people-laptop.webp?raw=true`,
            informationIcon: `${config.publicUrl}/assets/icon-information-orange.webp?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            siret: etablissement.formateur_siret,
            email: etablissement.gestionnaire_email,
            linkToForm: createRdvaPremiumParcoursupPageLink(email, etablissement.gestionnaire_siret, etablissement._id.toString()),
            optOutActivatedAtDate: dayjs(etablissement.optout_activation_date).format("DD/MM/YYYY"),
            emailGestionnaire: etablissement.gestionnaire_email,
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
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

  logger.info("Cron #premiumInviteOneShot done.")
}
