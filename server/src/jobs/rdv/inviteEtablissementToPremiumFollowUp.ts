import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../db/constants/etablissement.js"
import dayjs from "../../services/dayjs.service.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import config from "../../config.js"
import { Etablissement } from "../../db/index.js"
import mailer from "../../services/mailer.service.js"

/**
 * @description Invite all "etablissements" to Premium (followup).
 * @returns {Promise<void>}
 */
export const inviteEtablissementToPremiumFollowUp = async () => {
  logger.info("Cron #inviteEtablissementToPremiumFollowUp started.")

  const etablissementsFound = await Etablissement.find({
    gestionnaire_email: {
      $ne: null,
    },
    optout_activation_scheduled_date: {
      $ne: null,
    },
    premium_activation_date: null,
    premium_refusal_date: null,
    premium_invitation_date: {
      $ne: null,
      $lte: dayjs().subtract(10, "days").toDate(),
    },
    "to_etablissement_emails.campaign": {
      $ne: mailType.PREMIUM_INVITE_FOLLOW_UP,
    },
    affelnet_perimetre: null,
  })

  for (const etablissement of etablissementsFound) {
    if (!etablissement.gestionnaire_email || !isValidEmail(etablissement.gestionnaire_email)) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Parcoursup`,
      template: mailTemplate["mail-cfa-premium-invite-followup"],
      data: {
        isParcoursup: true,
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          integrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM"),
          linkToForm: `${config.publicUrlEspacePro}/form/premium/${etablissement._id}`,
        },
      },
    })

    await Etablissement.updateOne(
      { formateur_siret: etablissement.formateur_siret },
      {
        premium_invitation_date: dayjs().toDate(),
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

  logger.info("Cron #inviteEtablissementToPremiumFollowUp done.")
}
