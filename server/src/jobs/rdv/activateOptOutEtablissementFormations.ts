import _ from "lodash-es"
import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { referrers } from "../../common/model/constants/referrers.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service.js"

/**
 * @description Active all etablissement's formations that have subscribed to opt-out.
 * @returns {Promise<void>}
 */
export const activateOptOutEtablissementFormations = async ({ etablissements, mailer }) => {
  logger.info("Cron #activateOptOutEtablissementFormations started.")

  // Opt-out etablissement to activate
  const etablissementsToActivate = await etablissements.find({
    optout_activation_scheduled_date: {
      $lte: dayjs().toDate(),
    },
    opt_out_refused_at: null,
    opt_out_activated_at: null,
  })

  // Activate all formations, for all referrers that have a mail
  await Promise.all(
    etablissementsToActivate.map(async (etablissement) => {
      await Promise.all([
        eligibleTrainingsForAppointmentService.updateMany(
          {
            etablissement_formateur_siret: etablissement.formateur_siret,
            lieu_formation_email: { $nin: [null, ""] },
          },
          {
            referrers: Object.values(referrers)
              .map((referrer) => referrer.name)
              .filter((referrer) => referrer !== referrers.PARCOURSUP.name),
          }
        ),
        etablissements.findOneAndUpdate(
          {
            _id: etablissement._id,
          },
          { optout_activation_date: dayjs().toDate() }
        ),
      ])

      // Send email
      const { messageId } = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `C'est parti pour améliorer le sourcing de vos candidats !`,
        template: mailTemplate["mail-cfa-optout-start"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            optOutLbaIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_lba.png?raw=true`,
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-blue.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            linkToUnsubscribe: `${config.publicUrlEspacePro}/form/opt-out/unsubscribe/${etablissement._id}`,
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
          },
        },
      })

      const eligibleTrainingsForAppointmentsFound = await eligibleTrainingsForAppointmentService.find({
        etablissement_formateur_siret: etablissement.formateur_siret,
      })

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emails = eligibleTrainingsForAppointmentsFound.map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.lieu_formation_email)
      if (etablissement?.gestionnaire_email) {
        emails.push(etablissement.gestionnaire_email)
      }

      emails = _(emails)
        .uniq()
        .omitBy(_.isNil)
        .omitBy((item) => item === etablissement.gestionnaire_email)
        .toArray()

      await Promise.all(
        emails.map((email) =>
          mailer.sendEmail({
            to: email,
            subject: `La prise de rendez-vous est activée pour votre CFA sur La bonne alternance`,
            template: mailTemplate["mail-cfa-optout-activated"],
            data: {
              url: config.publicUrl,
              replyTo: config.publicEmail,
              images: {
                logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
                logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
                optOutLbaIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_lba.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                formateur_address: etablissement.formateur_address,
                formateur_zip_code: etablissement.formateur_zip_code,
                formateur_city: etablissement.formateur_city,
                siret: etablissement.formateur_siret,
                email: etablissement.gestionnaire_email,
                optOutActivatedAtDate: dayjs().format("DD/MM"),
                emailGestionnaire: etablissement.gestionnaire_email,
              },
              user: {
                destinataireEmail: email,
              },
            },
          })
        )
      )

      await etablissements.findOneAndUpdate(
        { _id: etablissement._id },
        {
          $push: {
            to_etablissement_emails: {
              campaign: mailType.OPT_OUT_STARTING,
              status: null,
              message_id: messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
        }
      )
    })
  )

  logger.info("Cron #activateOptOutEtablissementFormations done.")
}
