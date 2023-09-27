import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../../common/logger"
import { mailType } from "../../common/model/constants/etablissement"
import { Etablissement, EligibleTrainingsForAppointment } from "../../common/model/index"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import mailer from "../../services/mailer.service"

/**
 * @description Invite all "etablissements" to Premium.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToPremium = async () => {
  logger.info("Cron #inviteEtablissementToPremium started.")

  const startInvitationPeriod = dayjs().month(0).date(1)
  const endInvitationPeriod = dayjs().month(7).date(31)
  if (!dayjs().isBetween(startInvitationPeriod, endInvitationPeriod, "day", "[]")) {
    logger.info("Stopped because we are not between the 01/01 and the 31/08 (eligible period).")
    return
  }

  const etablissementsToInvite = await Etablissement.find({
    gestionnaire_email: {
      $ne: null,
    },
    premium_activation_date: null,
    "to_etablissement_emails.campaign": { $ne: mailType.PREMIUM_INVITE },
  })

  for (const etablissement of etablissementsToInvite) {
    // Only send an invite if the "etablissement" have at least one available Parcoursup "formation"
    const hasOneAvailableFormation = await EligibleTrainingsForAppointment.findOne({
      etablissement_formateur_siret: etablissement.formateur_siret,
      lieu_formation_email: { $ne: null },
      parcoursup_id: { $ne: null },
    }).lean()

    if (!hasOneAvailableFormation) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Parcoursup !`,
      template: getStaticFilePath("./templates/mail-cfa-premium-invite.mjml.ejs"),
      data: {
        isParcoursup: true,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          exempleParcoursup: `${config.publicUrl}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM"),
          linkToForm: `${config.publicUrl}/espace-pro/form/premium/${etablissement._id}`,
        },
      },
    })

    await Etablissement.updateOne(
      { formateur_siret: etablissement.formateur_siret },
      {
        premium_invitation_date: dayjs().toDate(),
        $push: {
          to_etablissement_emails: {
            campaign: mailType.PREMIUM_INVITE,
            status: null,
            message_id: messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      }
    )
  }

  logger.info("Cron #inviteEtablissementToPremium done.")
}
