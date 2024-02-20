import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { createRdvaPremiumAffelnetPageLink } from "@/services/appLinks.service"

import { logger } from "../../common/logger"
import { Etablissement } from "../../common/model/index"
import { isValidEmail } from "../../common/utils/isValidEmail"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import mailer from "../../services/mailer.service"

interface IEtablissementsToInviteToPremium {
  _id: {
    gestionnaire_siret: string
  }
  id: string
  gestionnaire_email: string
  optout_activation_scheduled_date: string
  count: number
}

export const inviteEtablissementAffelnetToPremiumFollowUp = async () => {
  logger.info("Cron #inviteEtablissementAffelnetToPremiumFollowUp started.")

  const etablissementsToInviteToPremium: Array<IEtablissementsToInviteToPremium> = await Etablissement.aggregate([
    {
      $match: {
        gestionnaire_email: {
          $ne: null,
        },
        premium_affelnet_activation_date: null,
        premium_affelnet_refusal_date: null,
        premium_affelnet_follow_up_date: null,
        $and: [{ premium_affelnet_invitation_date: { $ne: null } }, { premium_affelnet_invitation_date: { $lte: dayjs().subtract(10, "days").toDate() } }],
      },
    },
    {
      $group: {
        _id: {
          gestionnaire_siret: "$gestionnaire_siret",
        },
        id: { $first: "$_id" },
        optout_activation_scheduled_date: { $first: "$optout_activation_scheduled_date" },
        gestionnaire_email: { $first: "$gestionnaire_email" },
        count: { $sum: 1 },
      },
    },
  ])

  for (const etablissement of etablissementsToInviteToPremium) {
    if (!etablissement.gestionnaire_email || !isValidEmail(etablissement.gestionnaire_email) || !etablissement._id.gestionnaire_siret) {
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
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM/YYYY"),
          linkToForm: createRdvaPremiumAffelnetPageLink(etablissement.gestionnaire_email, etablissement._id.gestionnaire_siret, etablissement.id.toString()),
        },
      },
    })

    await Etablissement.updateMany(
      { gestionnaire_siret: etablissement._id.gestionnaire_siret },
      {
        premium_affelnet_follow_up_date: dayjs().toDate(),
      }
    )
  }

  logger.info("Cron #inviteEtablissementAffelnetToPremiumFollowUp done.")
}
