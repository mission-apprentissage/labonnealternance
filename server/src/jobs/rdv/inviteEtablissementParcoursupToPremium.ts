import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { isValidEmail } from "@/common/utils/isValidEmail"
import { createRdvaPremiumParcoursupPageLink } from "@/services/appLinks.service"

import { logger } from "../../common/logger"
import { mailType } from "../../common/model/constants/etablissement"
import { EligibleTrainingsForAppointment, Etablissement } from "../../common/model/index"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import mailer from "../../services/mailer.service"

/**
 * @description Invite all "etablissements" to Parcoursup Premium.
 * @returns {Promise<void>}
 */
export const inviteEtablissementParcoursupToPremium = async () => {
  logger.info("Cron #inviteEtablissementToPremium started.")

  const { startDay, startMonth } = config.parcoursupPeriods.start
  const { endDay, endMonth } = config.parcoursupPeriods.end

  const startInvitationPeriod = dayjs().month(startMonth).date(startDay)
  const endInvitationPeriod = dayjs().month(endMonth).date(endDay)
  if (!dayjs().isBetween(startInvitationPeriod, endInvitationPeriod, "day", "[]")) {
    logger.info("Stopped because we are not between the 08/01 and the 31/08 (eligible period).")
    return
  }

  const etablissementsToInvite = await Etablissement.find({
    gestionnaire_email: {
      $ne: null,
    },
    premium_activation_date: null,
    premium_invitation_date: null,
  }).lean()

  logger.info("Cron #inviteEtablissementToPremium / Etablissement: ", etablissementsToInvite.length)

  for (const etablissement of etablissementsToInvite) {
    // Only send an invite if the "etablissement" have at least one available Parcoursup "formation"
    const hasOneAvailableFormation = await EligibleTrainingsForAppointment.findOne({
      etablissement_gestionnaire_siret: etablissement.gestionnaire_siret,
      lieu_formation_email: { $ne: null },
      parcoursup_id: { $ne: null },
      parcoursup_statut: "publié",
    }).lean()

    if (!hasOneAvailableFormation || !isValidEmail(etablissement.gestionnaire_email) || !etablissement.gestionnaire_siret || !etablissement.gestionnaire_email) {
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
          linkToForm: createRdvaPremiumParcoursupPageLink(etablissement.gestionnaire_email, etablissement.gestionnaire_siret, etablissement._id.toString()),
        },
      },
    })

    await Etablissement.findByIdAndUpdate(etablissement._id, {
      premium_invitation_date: dayjs().toDate(),
      $push: {
        to_etablissement_emails: {
          campaign: mailType.PREMIUM_INVITE,
          status: null,
          message_id: messageId,
          email_sent_at: dayjs().toDate(),
        },
      },
    })
  }

  logger.info("Cron #inviteEtablissementToPremium done.")
}
