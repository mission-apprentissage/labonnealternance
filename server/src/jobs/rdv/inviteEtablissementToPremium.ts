import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"

/**
 * @description Invite all "etablissements" to Premium.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToPremium = async ({ etablissements, mailer, eligibleTrainingsForAppointments }) => {
  logger.info("Cron #inviteEtablissementToPremium started.")

  const etablissementsToInvite = await etablissements.find({
    gestionnaire_email: {
      $ne: null,
    },
    premium_activation_date: null,
    "to_etablissement_emails.campaign": { $ne: mailType.PREMIUM_INVITE },
  })

  for (const etablissement of etablissementsToInvite) {
    // Only send an invite if the "etablissement" have at least one available Parcoursup "formation"
    const hasOneAvailableFormation = await eligibleTrainingsForAppointments
      .findOne({
        etablissement_formateur_siret: etablissement.formateur_siret,
        lieu_formation_email: { $ne: null },
        parcoursup_id: { $ne: null },
      })
      .lean()

    if (!hasOneAvailableFormation) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Sourcez vos candidats sur Parcoursup !`,
      template: mailTemplate["mail-cfa-premium-invite"],
      data: {
        isParcoursup: true,
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          exempleParcoursup: `${config.publicUrlEspacePro}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM"),
          linkToForm: `${config.publicUrlEspacePro}/form/premium/${etablissement._id}`,
        },
      },
    })

    await etablissements.updateOne(
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
