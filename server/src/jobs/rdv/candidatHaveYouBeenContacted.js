import { logger } from "../../common/logger.js";
import { mailType } from "../../common/model/constants/appointments.js";
import { getReferrerById } from "../../common/model/constants/referrers.js";
import { dayjs } from "../../common/utils/dayjs.js";
import config from "../../config.js";
import { mailTemplate } from "../../assets/index.js";

/**
 * This cron has been "temporay" not trigger. This flow, is generating lots of emails to CFA.
 * @description Sends a mail to the candidat in order to know if he has been contacter or not.
 * @returns {Promise<void>}
 */
export const candidatHaveYouBeenContacted = async ({
  etablissements,
  widgetParameters,
  mailer,
  appointments,
  users,
}) => {
  logger.info("Cron #candidatHaveYouBeenContacted started.");

  // Appointments created there are less than 5 days
  const appointmentsToTrigger = await appointments
    .find({
      created_at: {
        $lte: dayjs().subtract(5, "days").toDate(),
        // Excludes very older appointments
        $gte: dayjs("2021-12-01T00:00:00.486Z").toDate(),
      },
      "candidat_mailing.campaign": { $ne: mailType.CANDIDAT_HAVE_YOU_BEEN_CONTACTED },
    })
    .lean();

  const promises = appointmentsToTrigger.map(async (appointment) => {
    const referrerObj = getReferrerById(appointment.referrer);

    const [user, widgetParameter, etablissement] = await Promise.all([
      users.findOne({ _id: appointment.candidat_id }),
      widgetParameters.findOne({ id_rco_formation: appointment.id_rco_formation }),
      etablissements.findOne({ siret_formateur: appointment.etablissement_id }),
    ]);

    const [mailCandidat, mailCfa] = await Promise.all([
      mailer.sendEmail({
        to: user.email,
        subject: `🛎️ Avez-vous été contacté par le centre de formation ?`,
        template: mailTemplate["mail-candidat-rdv-have-you-been-contacted"],
        data: {
          images: {
            logoCandidat: `${config.publicUrl}/espace-pro/assets/logo-lba-recruteur-candidat.png?raw=true`,
            logoFooter: `${config.publicUrl}/espace-pro/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            email: widgetParameter.email_rdv,
          },
          formation: {
            intitule: widgetParameter.formation_intitule,
          },
          user: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
          },
          appointment: {
            createdAt: dayjs(appointment.created_at).format("DD/MM/YYYY"),
            referrerLink: referrerObj.url,
            referrer: referrerObj.full_name,
          },
          links: {
            confirm: `${config.publicUrl}/espace-pro/appointment/candidat/follow-up/${appointment._id}/confirm`,
            resend: `${config.publicUrl}/espace-pro/appointment/candidat/follow-up/${appointment._id}/resend`,
          },
        },
      }),
      mailer.sendEmail({
        to: widgetParameter.email_rdv,
        subject: `[RDV via ${referrerObj.full_name}] 🛎 ️Pouvez-vous contacter ce candidat ?`,
        template: mailTemplate["mail-cfa-relance-demande-de-contact"],
        data: {
          images: {
            logoCfa: `${config.publicUrl}/espace-pro/assets/logo-lba-recruteur-candidat.png?raw=true`,
            logoFooter: `${config.publicUrl}/espace-pro/assets/logo-republique-francaise.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
          },
          formation: {
            intitule: widgetParameter.formation_intitule,
          },
          user: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
          },
          appointment: {
            createdAt: dayjs(appointment.created_at).format("DD/MM/YYYY"),
            motivation: appointment.motivations,
            referrerLink: referrerObj.url,
            referrer: referrerObj.full_name,
          },
        },
        from: config.rdvEmail,
      }),
    ]);

    await appointments.findOneAndUpdate(
      { _id: appointment._id },
      {
        $push: {
          candidat_mailing: {
            campaign: mailType.CANDIDAT_HAVE_YOU_BEEN_CONTACTED,
            status: null,
            message_id: mailCandidat.messageId,
            email_sent_at: dayjs().toDate(),
          },
          cfa_mailing: {
            campaign: mailType.CFA_REMINDER_RESEND_APPOINTMENT,
            status: null,
            message_id: mailCfa.messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      }
    );
  });

  await Promise.all(promises);

  logger.info("Cron #candidatHaveYouBeenContacted done.");
};
