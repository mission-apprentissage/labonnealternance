import { logger } from "../../common/logger.js"
import { mailType, optMode } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import config from "../../config.js"
import { mailTemplate } from "../../assets/index.js"

/**
 * @description Invite all "etablissements" to Premium (followup).
 * @returns {Promise<void>}
 */
export const inviteEtablissementToPremiumFollowUp = async ({ etablissements, mailer }) => {
  logger.info("Cron #inviteEtablissementToPremiumFollowUp started.")

  const etablissementsFound = await etablissements.find({
    email_decisionnaire: {
      $ne: null,
    },
    opt_mode: optMode.OPT_OUT,
    opt_out_will_be_activated_at: {
      $ne: null,
    },
    premium_activated_at: null,
    premium_refused_at: null,
    premium_invited_at: {
      $ne: null,
      $lte: dayjs().subtract(10, "days").toDate(),
    },
    "mailing.campaign": {
      $ne: mailType.PREMIUM_INVITE_FOLLOW_UP,
    },
  })

  for (const etablissement of etablissementsFound) {
    if (!etablissement.email_decisionnaire || !isValidEmail(etablissement.email_decisionnaire)) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.email_decisionnaire,
      subject: `Rendez-vous Apprentissage est disponible sur Parcoursup`,
      template: mailTemplate["mail-cfa-premium-invite-followup"],
      data: {
        images: {
          logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
          logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          parcoursupIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.email_decisionnaire,
          activatedAt: dayjs(etablissement.opt_out_will_be_activated_at).format("DD/MM"),
          linkToForm: `${config.publicUrlEspacePro}/form/premium/${etablissement._id}`,
        },
      },
      from: config.email,
    })

    await etablissements.updateOne(
      { siret_formateur: etablissement.siret_formateur },
      {
        premium_invited_at: dayjs().toDate(),
        $push: {
          mailing: {
            campaign: mailType.PREMIUM_INVITE_FOLLOW_UP,
            status: null,
            message_id: messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      }
    )
  }

  logger.info("Cron #inviteEtablissementToPremiumFollowUp done.")
}
