import path from "path";
import __dirname from "../common/dirname.js";
import { logger } from "../common/logger.js";
import { mailType } from "../common/model/constants/etablissement.js";
import { dayjs } from "../common/utils/dayjs.js";
import config from "../config.js";
const currentDirname = __dirname(import.meta.url);

/**
 * @description Invite all "etablissements" to Premium.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToPremium = async ({ etablissements, mailer }) => {
  logger.info("Cron #inviteEtablissementToPremium started.");

  const etablissementsActivated = await etablissements.find({
    email_decisionnaire: {
      $ne: null,
    },
    opt_out_will_be_activated_at: {
      $ne: null,
      $lte: dayjs().subtract(1, "day").toDate(),
    },
    "mailing.campaign": { $ne: mailType.PREMIUM_INVITE },
  });

  for (const etablissement of etablissementsActivated) {
    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.email_decisionnaire,
      subject: `Optimisez le sourcing de vos candidats sur Parcoursup !`,
      template: path.join(currentDirname, `../assets/templates/mail-cfa-premium-invite.mjml.ejs`),
      data: {
        images: {
          logoCfa: `${config.publicUrl}/assets/logo-lba-recruteur-cfa.png?raw=true`,
          logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          parcoursupIntegrationExample: `${config.publicUrl}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.email_decisionnaire,
          activatedAt: dayjs(etablissement.opt_out_will_be_activated_at).format("DD/MM"),
          linkToForm: `${config.publicUrl}/form/premium/${etablissement._id}`,
        },
      },
      from: config.rdvEmail,
    });

    await etablissements.updateOne(
      { siret_formateur: etablissement.siret_formateur },
      {
        premium_invited_at: dayjs().toDate(),
        $push: {
          mailing: {
            campaign: mailType.PREMIUM_INVITE,
            status: null,
            message_id: messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      }
    );
  }

  logger.info("Cron #inviteEtablissementToPremium done.");
};
