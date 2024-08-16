import * as _ from "lodash-es"
import { referrers } from "shared/constants/referers"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import mailer from "../../services/mailer.service"

/**
 * @description Active all etablissement's formations that have subscribed to opt-out.
 * @returns {Promise<void>}
 */
export const activateOptoutOnEtablissementAndUpdateReferrersOnETFA = async () => {
  logger.info("Cron #activateOptOutEtablissementFormations started.")

  // Opt-out etablissement to activate
  const etablissementsToActivate = await getDbCollection("etablissements")
    .find({
      optout_activation_scheduled_date: {
        $lte: new Date(),
      },
      optout_refusal_date: null,
      optout_activation_date: null,
      gestionnaire_email: { $ne: null },
    })
    .toArray()

  // Activate all formations, for all referrers that have a mail
  await Promise.all(
    etablissementsToActivate.map(async (etablissement) => {
      await Promise.all([
        getDbCollection("eligible_trainings_for_appointments").updateMany(
          {
            etablissement_formateur_siret: etablissement.formateur_siret,
            lieu_formation_email: { $nin: [null, ""] },
          },
          {
            $set: {
              referrers: [referrers.JEUNE_1_SOLUTION.name, referrers.LBA.name],
            },
          }
        ),
        getDbCollection("etablissements").findOneAndUpdate(
          {
            _id: etablissement._id,
          },
          { $set: { optout_activation_date: new Date() } }
        ),
      ])

      if (!etablissement.gestionnaire_email) return
      // Send email
      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `La prise de RDV est activée pour votre CFA sur La bonne alternance`,
        template: getStaticFilePath("./templates/mail-cfa-optout-start.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
            optOutLbaIntegrationExample: `${config.publicUrl}/assets/exemple_integration_lba.png?raw=true`,
            informationIcon: `${config.publicUrl}/assets/icon-information-blue.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            linkToUnsubscribe: `${config.publicUrl}/espace-pro/form/opt-out/unsubscribe/${etablissement._id}`,
          },
        },
      })

      const eligibleTrainingsForAppointmentsFound = await eligibleTrainingsForAppointmentService.find({
        etablissement_gestionnaire_siret: etablissement.gestionnaire_siret,
      })

      // Gets all mails (formation email + formateur email), excepted "email_decisionnaire"
      let emails = eligibleTrainingsForAppointmentsFound.flatMap((eligibleTrainingsForAppointment) => {
        const email = eligibleTrainingsForAppointment.lieu_formation_email
        if (!_.isNil(email) && email !== etablissement.gestionnaire_email) {
          return [email]
        } else {
          return []
        }
      })
      emails = [...new Set(emails)]

      await Promise.all(
        emails.map((email) =>
          mailer.sendEmail({
            to: email,
            subject: `La prise de RDV est activée pour votre CFA sur La bonne alternance`,
            template: getStaticFilePath("./templates/mail-cfa-optout-activated.mjml.ejs"),
            data: {
              url: config.publicUrl,
              replyTo: config.publicEmail,
              images: {
                logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
                logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
                peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
                optOutLbaIntegrationExample: `${config.publicUrl}/assets/exemple_integration_lba.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                formateur_address: etablissement.formateur_address,
                formateur_zip_code: etablissement.formateur_zip_code,
                formateur_city: etablissement.formateur_city,
                siret: etablissement.formateur_siret,
                email: etablissement.gestionnaire_email,
                optOutActivatedAtDate: dayjs().format("DD/MM/YYYY"),
                emailGestionnaire: etablissement.gestionnaire_email,
              },
              user: {
                destinataireEmail: email,
              },
            },
          })
        )
      )
    })
  )

  logger.info("Cron #activateOptOutEtablissementFormations done.")
}
