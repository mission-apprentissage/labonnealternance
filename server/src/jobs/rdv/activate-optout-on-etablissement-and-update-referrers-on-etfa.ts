import * as _ from "lodash-es"

import dayjs from "shared/helpers/dayjs"
import { logger } from "@/common/logger"
import { getEmailLogos } from "@/common/utils/email-logos"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { createRdvaOptOutUnsubscribePageLink } from "@/services/app-links.service"
import * as eligibleTrainingsForAppointmentService from "@/services/eligible-trainings-for-appointment.service"
import mailer from "@/services/mailer.service"
import { recomputeReferrers } from "@/services/referrers-diffusion.service"

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

  // Active les formations qui ont un e-mail, une fois la date posée : recomputeReferrers la lit
  await Promise.all(
    etablissementsToActivate.map(async (etablissement) => {
      await getDbCollection("etablissements").findOneAndUpdate({ _id: etablissement._id }, { $set: { optout_activation_date: new Date() } })
      await recomputeReferrers({
        etablissement_formateur_siret: etablissement.formateur_siret,
        lieu_formation_email: { $nin: [null, ""] },
      })

      if (!etablissement.gestionnaire_email) return
      if (!etablissement.gestionnaire_siret) return

      const eligibleTrainingsForAppointmentsFound = await eligibleTrainingsForAppointmentService.find({
        etablissement_gestionnaire_siret: etablissement.gestionnaire_siret,
      })

      await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: "Le service de mise en relation est activé pour votre CFA sur La bonne alternance",
        template: getStaticFilePath("./templates/mail-cfa-optout-start.mjml.ejs"),
        data: {
          images: {
            ...getEmailLogos(),
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

      // Emails des lieux de formation, hors email décisionnaire (gestionnaire_email)
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
                ...getEmailLogos(),
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
