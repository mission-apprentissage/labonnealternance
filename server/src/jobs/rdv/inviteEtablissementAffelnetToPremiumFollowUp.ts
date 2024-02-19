import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { createRdvaPremiumAffelnetPageLink } from "@/services/appLinks.service"

import { logger } from "../../common/logger"
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
    gestionnaire_email: {
      $ne: null,
    },
    premium_affelnet_activation_date: null,
    premium_affelnet_refusal_date: null,
    premium_affelnet_follow_up_date: null,
    $and: [{ premium_affelnet_invitation_date: { $ne: null } }, { premium_affelnet_invitation_date: { $lte: dayjs().subtract(10, "days").toDate() } }],
  })

  for (const etablissement of etablissementsFound) {
    if (!etablissement.gestionnaire_email || !isValidEmail(etablissement.gestionnaire_email) || !etablissement.gestionnaire_siret) {
      continue
    }

    // Invite all etablissements only in production environment
    await mailer.sendEmail({
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
          activatedAt: dayjs(etablissement.created_at).format("DD/MM/YYYY"),
          linkToForm: createRdvaPremiumAffelnetPageLink(etablissement.gestionnaire_email, etablissement.gestionnaire_siret, etablissement._id.toString()),
        },
      },
    })

    await Etablissement.updateMany(
      { gestionnaire_siret: etablissement.gestionnaire_siret },
      {
        premium_affelnet_follow_up_date: dayjs().toDate(),
      }
    )
  }

  logger.info("Cron #inviteEtablissementAffelnetToPremiumFollowUp done.")
}
