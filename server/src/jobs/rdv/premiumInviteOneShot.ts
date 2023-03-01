import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"

/**
 * @description Send a "Premium" reminder mail.
 * @returns {Promise<void>}
 */
export const premiumInviteOneShot = async ({ etablissements, widgetParameters, mailer }) => {
  logger.info("Cron #premiumInviteOneShot started.")

  const [etablissementsActivated, widgetParametersFound] = await Promise.all([
    etablissements
      .find({
        gestionnaire_email: {
          $ne: null,
        },
        optout_activation_date: {
          $ne: null,
        },
        premium_activation_date: null,
      })
      .lean(),
    widgetParameters.find({ id_parcoursup: { $ne: null }, email_rdv: { $ne: null } }).lean(),
  ])

  const etablissementWithParcoursup = etablissementsActivated.filter((etablissement) =>
    widgetParametersFound.find((widgetParameter) => widgetParameter.etablissement_formateur_siret === etablissement.formateur_siret)
  )

  for (const etablissement of etablissementWithParcoursup) {
    try {
      if (!isValidEmail) {
        logger.info("Invalid email syntax.", { etablissement })
        continue
      }

      const { messageId } = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Activez la prise de rendez-vous apprentissage sur Parcoursup`,
        template: mailTemplate["mail-cfa-premium-invite-one-shot"],
        data: {
          replyTo: config.publicEmail,
          url: config.publicUrl,
          images: {
            logo: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
            logoParcoursup: `${config.publicUrlEspacePro}/assets/logo-parcoursup.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-orange.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.zip_code,
            ville: etablissement.city,
            siret: etablissement.formateur_siret,
            email: etablissement.gestionnaire_email,
            linkToForm: `${config.publicUrlEspacePro}/form/premium/${etablissement._id}`,
            optOutActivatedAtDate: dayjs(etablissement.optout_activation_date).format("DD/MM/YYYY"),
            emailGestionnaire: etablissement.gestionnaire_email,
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
          },
        },
      })

      await etablissements.updateOne(
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
