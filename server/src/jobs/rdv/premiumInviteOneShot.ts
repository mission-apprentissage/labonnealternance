import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../../common/logger"
import { mailType } from "../../common/model/constants/etablissement"
import { Etablissement } from "../../common/model/index"
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
    Etablissement.find({
      gestionnaire_email: {
        $ne: null,
      },
      optout_activation_date: {
        $ne: null,
      },
      premium_activation_date: null,
    }).lean(),
    eligibleTrainingsForAppointmentService.find({ parcoursup_id: { $ne: null }, lieu_formation_email: { $ne: null } }).lean(),
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

      const { messageId } = await mailer.sendEmail({
        to: email,
        subject: `Trouvez et recrutez vos candidats sur Parcoursup`,
        template: getStaticFilePath("./templates/mail-cfa-premium-invite-one-shot.mjml.ejs"),
        data: {
          replyTo: config.publicEmail,
          url: config.publicUrl,
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoParcoursup: `${config.publicUrl}/assets/logo-parcoursup.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
            peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
            informationIcon: `${config.publicUrl}/assets/icon-information-orange.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            siret: etablissement.formateur_siret,
            email: etablissement.gestionnaire_email,
            linkToForm: `${config.publicUrl}/espace-pro/form/premium/${etablissement._id}`,
            optOutActivatedAtDate: dayjs(etablissement.optout_activation_date).format("DD/MM/YYYY"),
            emailGestionnaire: etablissement.gestionnaire_email,
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
          },
        },
      })

      await Etablissement.updateOne(
        { formateur_siret: etablissement.formateur_siret },
        {
          premium_invitation_date: dayjs().toDate(),
          $push: {
            to_etablissement_emails: {
              campaign: mailType.PREMIUM_INVITE_ONE_SHOT_2023,
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

  logger.info("Cron #premiumInviteOneShot done.")
}
