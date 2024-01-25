import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { createRdvaPremiumParcoursupPageLink } from "@/services/appLinks.service"

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
    if (!etablissement.gestionnaire_email || !isValidEmail(etablissement.gestionnaire_email) || !etablissement.formateur_siret) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Parcoursup`,
      template: getStaticFilePath("./templates/mail-cfa-premium-invite-followup.mjml.ejs"),
      data: {
        isParcoursup: true,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          integrationExample: `${config.publicUrl}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM"),
          linkToForm: createRdvaPremiumParcoursupPageLink(etablissement.gestionnaire_email, etablissement.formateur_siret, etablissement._id.toString()),
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
