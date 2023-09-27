import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../../common/logger"
import { mailType } from "../../common/model/constants/etablissement"
import { Etablissement } from "../../common/model/index"
import { isValidEmail } from "../../common/utils/isValidEmail"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import mailer from "../../services/mailer.service"

/**
 * @description Invite all "etablissements" to Premium (followup).
 * @returns {Promise<void>}
 */
export const inviteEtablissementAffelnetToPremiumFollowUp = async () => {
  logger.info("Cron #inviteEtablissementAffelnetToPremiumFollowUp started.")

  const etablissementsFound = await Etablissement.find({
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
      $ne: mailType.PREMIUM_AFFELNET_INVITE_FOLLOW_UP,
    },
  })

  for (const etablissement of etablissementsFound) {
    if (!etablissement.gestionnaire_email || !isValidEmail(etablissement.gestionnaire_email)) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Choisir son affectation après la 3e`,
      template: getStaticFilePath("./templates/mail-cfa-premium-invite-followup.mjml.ejs"),
      data: {
        isAffelnet: true,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          integrationExample: `${config.publicUrl}/assets/exemple_integration_affelnet.png?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.created_at).format("DD/MM"),
          linkToForm: `${config.publicUrl}/espace-pro/form/premium/affelnet/${etablissement._id}`,
        },
      },
    })

    await Etablissement.updateOne(
      { formateur_siret: etablissement.formateur_siret },
      {
        premium_affelnet_invitation_date: dayjs().toDate(),
        $push: {
          to_etablissement_emails: {
            campaign: mailType.PREMIUM_AFFELNET_INVITE_FOLLOW_UP,
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
