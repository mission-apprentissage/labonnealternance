import path from "path";
import __dirname from "../common/dirname.js";
import { logger } from "../common/logger.js";
import { mailType } from "../common/model/constants/etablissement.js";
import { referrers } from "../common/model/constants/referrers.js";
import { dayjs } from "../common/utils/dayjs.js";
import config from "../config.js";
const currentDirname = __dirname(import.meta.url);

/**
 * @description Active all etablissement's formations that have subscribed to opt-out.
 * @returns {Promise<void>}
 */
export const activateOptOutEtablissementFormations = async ({ etablissements, widgetParameters, mailer }) => {
  logger.info("Cron #activateOptOutEtablissementFormations started.");

  // Opt-out etablissement to activate
  const etablissementsToActivate = await etablissements.find({
    opt_out_will_be_activated_at: {
      $lte: dayjs().toDate(),
    },
    opt_out_refused_at: null,
    opt_out_activated_at: null,
  });

  // Activate all formations, for all referrers that have a mail
  await Promise.all(
    etablissementsToActivate.map(async (etablissement) => {
      await Promise.all([
        widgetParameters.updateMany(
          {
            etablissement_siret: etablissement.siret_formateur,
            email_rdv: { $nin: [null, ""] },
          },
          {
            referrers: Object.values(referrers)
              .map((referrer) => referrer.code)
              .filter((referrer) => referrer !== referrers.PARCOURSUP.code),
          }
        ),
        etablissements.findOneAndUpdate(
          {
            _id: etablissement._id,
          },
          { opt_out_activated_at: dayjs().toDate() }
        ),
      ]);

      // Send email
      const { messageId } = await mailer.sendEmail({
        to: etablissement.email_decisionnaire,
        subject: `C'est parti pour améliorer le sourcing de vos candidats !`,
        template: path.join(currentDirname, `../assets/templates/mail-cfa-optout-start.mjml.ejs`),
        data: {
          images: {
            logoCfa: `${config.publicUrl}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
            optOutLbaIntegrationExample: `${config.publicUrl}/assets/exemple_integration_lba.png?raw=true`,
            informationIcon: `${config.publicUrl}/assets/icon-information-blue.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement.siret_formateur,
            linkToUnsubscribe: `${config.publicUrl}/form/opt-out/unsubscribe/${etablissement._id}`,
          },
          user: {
            destinataireEmail: etablissement.email_decisionnaire,
          },
        },
        from: config.rdvEmail,
      });

      await etablissements.findOneAndUpdate(
        { _id: etablissement._id },
        {
          $push: {
            mailing: {
              campaign: mailType.OPT_OUT_STARTING,
              status: null,
              message_id: messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
        }
      );
    })
  );

  logger.info("Cron #activateOptOutEtablissementFormations done.");
};
