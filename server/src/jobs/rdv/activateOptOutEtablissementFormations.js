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
    opt_out_will_be_activated_at: {
      $lte: dayjs().toDate(),
    },
    opt_out_refused_at: null,
    opt_out_activated_at: null,
  })

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
      ])

      // Send email
      const { messageId } = await mailer.sendEmail({
        to: etablissement.email_decisionnaire,
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
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement.siret_formateur,
            linkToUnsubscribe: `${config.publicUrlEspacePro}/form/opt-out/unsubscribe/${etablissement._id}`,
          },
          user: {
            destinataireEmail: etablissement.email_decisionnaire,
          },
        },
      })

      const widgetParametersFound = await widgetParameters.find({
        etablissement_siret: etablissement.siret_formateur,
      })

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emails = widgetParametersFound.map((widgetParameter) => widgetParameter.email_rdv)
      if (etablissement?.etablissement_formateur_courriel) {
        emails.push(etablissement.etablissement_formateur_courriel)
      }

      emails = _(emails)
        .uniq()
        .omitBy(_.isNil)
        .omitBy((item) => item === etablissement.email_decisionnaire)
        .toArray()

      await Promise.all(
        emails.map((email) =>
          mailer.sendEmail({
            to: email,
            subject: `La prise de rendez-vous est activée pour votre CFA sur La bonne alternance`,
            template: mailTemplate["mail-cfa-optout-activated"],
            data: {
              images: {
                logo: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
                logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
                optOutLbaIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_lba.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                address: etablissement.adresse,
                postalCode: etablissement.code_postal,
                ville: etablissement.localite,
                siret: etablissement.siret_formateur,
                email: etablissement.email_decisionnaire,
                optOutActivatedAtDate: dayjs().format("DD/MM"),
                emailGestionnaire: etablissement.email_decisionnaire,
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
            mailing: {
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
