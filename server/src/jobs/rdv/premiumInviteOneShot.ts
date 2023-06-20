import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service.js"

/**
 * @description Send a "Premium" reminder mail.
 * @returns {Promise<void>}
 */
export const premiumInviteOneShot = async ({ etablissements, mailer }) => {
  logger.info("Cron #premiumInviteOneShot started.")

  const [etablissementsActivated, widgetParametersFound] = await Promise.all([
    etablissements
      .find({
        email_decisionnaire: {
          $ne: null,
        },
        opt_out_activated_at: {
          $ne: null,
        },
        premium_activated_at: null,
      })
      .lean(),
    eligibleTrainingsForAppointmentService.find({ parcoursup_id: { $ne: null }, lieu_formation_email: { $ne: null } }).lean(),
  ])

  const etablissementWithParcoursup = etablissementsActivated.filter((etablissement) =>
    widgetParametersFound.find((widgetParameter) => widgetParameter.etablissement_formateur_siret === etablissement.siret_formateur)
  )

  for (const etablissement of etablissementWithParcoursup) {
    try {
      if (!isValidEmail) {
        logger.info("Invalid email syntax.", { etablissement })
        continue
      }

      const { messageId } = await mailer.sendEmail({
        to: etablissement.email_decisionnaire,
        subject: `Activez la prise de rendez-vous apprentissage sur Parcoursup`,
        template: mailTemplate["mail-cfa-premium-invite-one-shot"],
        data: {
          replyTo: config.publicEmail,
          url: config.publicUrl,
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
            logoParcoursup: `${config.publicUrlEspacePro}/assets/logo-parcoursup.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-orange.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement.siret_formateur,
            email: etablissement.email_decisionnaire,
            linkToForm: `${config.publicUrlEspacePro}/form/premium/${etablissement._id}`,
            optOutActivatedAtDate: dayjs(etablissement.opt_out_activated_at).format("DD/MM/YYYY"),
            emailGestionnaire: etablissement.email_decisionnaire,
          },
          user: {
            destinataireEmail: etablissement.email_decisionnaire,
          },
        },
      })

      await etablissements.updateOne(
        { siret_formateur: etablissement.siret_formateur },
        {
          premium_invited_at: dayjs().toDate(),
          $push: {
            mailing: {
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
