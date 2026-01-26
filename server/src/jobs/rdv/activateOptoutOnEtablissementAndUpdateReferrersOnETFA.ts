import * as _ from "lodash-es"
import { referrers } from "shared/constants/referers"

import dayjs from "shared/helpers/dayjs"
import { logger } from "@/common/logger"
import config from "@/config"
import * as eligibleTrainingsForAppointmentService from "@/services/eligibleTrainingsForAppointment.service"
import mailer from "@/services/mailer.service"
import { createRdvaOptOutUnsubscribePageLink } from "@/services/appLinks.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

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
      if (!etablissement.gestionnaire_siret) return

      const eligibleTrainingsForAppointmentsFound = await eligibleTrainingsForAppointmentService.find({
        etablissement_gestionnaire_siret: etablissement.gestionnaire_siret,
      })

      // Send email
      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: "Le service de mise en relation est activé pour votre CFA sur La bonne alternance",
        template: getStaticFilePath("./templates/mail-cfa-optout-start.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            formateur_siret: etablissement.formateur_siret,
            linkToUnsubscribe: createRdvaOptOutUnsubscribePageLink(etablissement.gestionnaire_email, etablissement.gestionnaire_siret, etablissement._id.toString()),
            trainingCount: eligibleTrainingsForAppointmentsFound.length,
          },
          publicEmail: config.publicEmail,
          utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-optout-confirmation-activation",
        },
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
        emails.map(async (email) =>
          mailer.sendEmail({
            to: email,
            subject: `Le formulaire de contact est activé pour votre CFA sur La bonne alternance`,
            template: getStaticFilePath("./templates/mail-cfa-optout-activated.mjml.ejs"),
            data: {
              url: config.publicUrl,
              images: {
                logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
                logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
                optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
              },
              etablissement: {
                name: etablissement.raison_sociale,
                formateur_address: etablissement.formateur_address,
                formateur_zip_code: etablissement.formateur_zip_code,
                formateur_city: etablissement.formateur_city,
                siret: etablissement.formateur_siret,
                optOutActivatedAtDate: dayjs().format("DD/MM/YYYY"),
              },
              publicEmail: config.publicEmail,
              utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-optout-notification-formateur",
            },
          })
        )
      )
    })
  )

  logger.info("Cron #activateOptOutEtablissementFormations done.")
}
