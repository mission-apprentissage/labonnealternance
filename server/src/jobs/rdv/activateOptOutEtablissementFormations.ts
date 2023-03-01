import _ from "lodash-es"
import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { referrers } from "../../common/model/constants/referrers.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"

/**
 * @description Active all etablissement's formations that have subscribed to opt-out.
 * @returns {Promise<void>}
 */
export const activateOptOutEtablissementFormations = async ({ etablissements, widgetParameters, mailer }) => {
  logger.info("Cron #activateOptOutEtablissementFormations started.")

  // Opt-out etablissement to activate
  const etablissementsToActivate = await etablissements.find({
    optout_activation_scheduled_date: {
      $lte: dayjs().toDate(),
    },
    optout_refusal_date: null,
    optout_activation_date: null,
  })

  // Activate all formations, for all referrers that have a mail
  await Promise.all(
    etablissementsToActivate.map(async (etablissement) => {
      await Promise.all([
        widgetParameters.updateMany(
          {
            etablissement_siret: etablissement.formateur_siret,
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
            logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            optOutLbaIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_lba.png?raw=true`,
            informationIcon: `${config.publicUrlEspacePro}/assets/icon-information-blue.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.zip_code,
            ville: etablissement.city,
            siret: etablissement.formateur_siret,
            linkToUnsubscribe: `${config.publicUrlEspacePro}/form/opt-out/unsubscribe/${etablissement._id}`,
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
          },
        },
      })

      const widgetParametersFound = await widgetParameters.find({
        etablissement_siret: etablissement.formateur_siret,
      })

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emails = widgetParametersFound.map((widgetParameter) => widgetParameter.email_rdv)
      if (etablissement?.etablissement_formateur_courriel) {
        emails.push(etablissement.etablissement_formateur_courriel)
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
                logo: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
                logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
                optOutLbaIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_lba.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                address: etablissement.adresse,
                postalCode: etablissement.zip_code,
                ville: etablissement.city,
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
