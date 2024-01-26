import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { createRdvaPremiumAffelnetPageLink } from "@/services/appLinks.service"

import { logger } from "../../common/logger"
import { mailType } from "../../common/model/constants/etablissement"
import { Etablissement } from "../../common/model/index"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import mailer from "../../services/mailer.service"

export const inviteEtablissementAffelnetToPremium = async () => {
  logger.info("Cron #inviteEtablissementAffelnetToPremium started.")

  const startInvitationPeriod = dayjs().month(3).date(2)
  const endInvitationPeriod = dayjs().month(7).date(31)
  if (!dayjs().isBetween(startInvitationPeriod, endInvitationPeriod, "day", "[]")) {
    logger.info("Stopped because we are not between the 01/03 and the 31/08 (eligible period).")
    return
  }

  // Get all Affelnet establishement where an email is specified
  const etablissementToInvite = await Etablissement.find({
    affelnet_perimetre: true,
    gestionnaire_email: {
      $ne: null,
    },
    premium_affelnet_invitation_date: null,
  })

  for (const etablissement of etablissementToInvite) {
    if (!etablissement.gestionnaire_email || !etablissement.formateur_siret) {
      continue
    }

    // send the invitation mail
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Choisir son affectation après la 3e !`,
      template: getStaticFilePath("./templates/mail-cfa-premium-invite.mjml.ejs"),
      data: {
        isAffelnet: true,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          exempleParcoursup: `${config.publicUrl}/assets/exemple_integration_affelnet.png?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.created_at).format("DD/MM"),
          linkToForm: createRdvaPremiumAffelnetPageLink(etablissement.gestionnaire_email, etablissement.formateur_siret, etablissement._id.toString()),
        },
      },
    })

    await Etablissement.updateOne(
      { formateur_siret: etablissement.formateur_siret },
      {
        premium_affelnet_invitation_date: dayjs().toDate(),
        $push: {
          to_etablissement_emails: {
            campaign: mailType.PREMIUM_AFFELNET_INVITE,
            status: null,
            message_id: messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      }
    )
  }

  logger.info("Cron #inviteEtablissementAffelnetToPremium done.")
}
