import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import config from "../../config.js"

/**
 * @description Invite all "etablissements" to Premium (followup).
 * @returns {Promise<void>}
 */
export const inviteEtablissementAffelnetToPremiumFollowUp = async ({ etablissements, mailer }) => {
  logger.info("Cron #inviteEtablissementAffelnetToPremiumFollowUp started.")

  const etablissementsFound = await etablissements.find({
    affelnet_perimetre: true,
    gestionnaire_email: {
      $ne: null,
    },
    premium_affelnet_activation_date: null,
    premium_affelnet_refusal_date: null,
    premium_affelnet_invitation_date: {
      $ne: null,
      $lte: dayjs().subtract(7, "days").toDate(),
    },
    "to_etablissement_emails.campaign": {
      $ne: mailType.PREMIUM_INVITE_FOLLOW_UP,
    },
  })

  for (const etablissement of etablissementsFound) {
    if (!etablissement.gestionnaire_email || !isValidEmail(etablissement.gestionnaire_email)) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Rendez-vous Apprentissage est disponible sur Choisir son affectation après la 3e`,
      template: mailTemplate["mail-cfa-premium-invite-followup"],
      data: {
        isAffelnet: true,
        images: {
          logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
          logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          parcoursupIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_affelnet.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.created_at).format("DD/MM"),
          linkToForm: `${config.publicUrlEspacePro}/form/premium/${etablissement._id}`,
        },
      },
    })

    await etablissements.updateOne(
      { formateur_siret: etablissement.formateur_siret },
      {
        premium_affelnet_invitation_date: dayjs().toDate(),
        $push: {
          to_etablissement_emails: {
            campaign: mailType.PREMIUM_INVITE_FOLLOW_UP,
            status: null,
            message_id: messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      }
    )
  }

  logger.info("Cron #inviteEtablissementAffelnetToPremiumFollowUp done.")
}
