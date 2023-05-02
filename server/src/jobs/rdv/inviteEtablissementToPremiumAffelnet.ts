import { mailTemplate } from "../../assets/index.js"
import dayjs from "../../common/dayjs.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { Etablissement } from "../../common/model/index.js"
import config from "../../config.js"

export const inviteEtablissementAffelnetToPremium = async ({ mailer }) => {
  logger.info("Cron #inviteEtablissementAffelnetToPremium started.")
  // Get all Affelnet establishement where an email is specified
  const etablissementToInvite = await Etablissement.find({
    affelnet_perimetre: true,
    gestionnaire_email: {
      $ne: null,
    },
    premium_affelnet_invitation_date: null,
  })

  for (const etablissement of etablissementToInvite) {
    // send the invitation mail
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Optimisez le sourcing de vos candidats sur Choisir son affectation après la 3e !`,
      template: mailTemplate["mail-cfa-premium-invite"],
      data: {
        isAffelnet: true,
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          exempleParcoursup: `${config.publicUrlEspacePro}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.created_at).format("DD/MM"),
          linkToForm: `${config.publicUrlEspacePro}/form/premium/affelnet/${etablissement._id}`,
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
