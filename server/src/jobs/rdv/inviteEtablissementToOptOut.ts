import _ from "lodash-es"
import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import config from "../../config.js"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service.js"

/**
 * @description Invite all "etablissements" without opt_mode to opt-out.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToOptOut = async ({ etablissements, mailer }) => {
  logger.info("Cron #inviteEtablissementToOptOut started.")

  // Opt-out etablissement to activate
  const etablissementsWithouOptMode = await etablissements.find({
    optout_invitation_date: null,
    gestionnaire_email: { $nin: [null, ""] },
    affelnet_perimetre: null,
  })

  logger.info(`Etablissements to invite: ${etablissementsWithouOptMode.length}`)

  for (const etablissement of etablissementsWithouOptMode) {
    const formations = await eligibleTrainingsForAppointmentService.find({
      etablissement_siret: etablissement.formateur_siret,
    })

    let emailDecisionaire = etablissement.email_decisionnaire

    // If etablissement haven't a valid "email_decisionnaire"
    if (!etablissement.email_decisionnaire || !isValidEmail(emailDecisionaire)) {
      // If "email_rdv" exists, add 1 occurrence, otherwise set counter to 1
      const emailCounter: object = {}
      formations.map(({ email_rdv }) => {
        // Ignore null, empty or not valid email
        if (!email_rdv || !isValidEmail(email_rdv)) {
          logger.info("Invalid email", { email: email_rdv, siret_formateur: etablissement.siret_formateur })
          return
        }

        return emailCounter[email_rdv] ? emailCounter[email_rdv]++ : (emailCounter[email_rdv] = 1)
      })

      // Ignore etablissement without formation emails
      if (!Object.keys(emailCounter).length) {
        logger.info("Siret without formation emails", { siret_formateur: etablissement.siret_formateur })
        continue
      }

      // Getting max number of occurrences
      const max = Math.max(...Object.values(emailCounter))

      // Getting array of highest duplicate values
      const highestEmail = Object.entries(emailCounter).filter(([, reps]) => reps === max)

      // Get most present email
      emailDecisionaire = highestEmail[0][0]

      // Save most present email as "email_decisionnaire"
      await etablissement.update({ email_decisionnaire: emailDecisionaire })
    }

    // Invite all etablissements only in production environment, for etablissement that have an "email_decisionnaire"
    if (emailDecisionaire) {
      const willBeActivatedAt = dayjs().add(15, "days")

      const { messageId } = await mailer.sendEmail({
        to: emailDecisionaire,
        subject: `Améliorer le sourcing de vos candidats !`,
        template: mailTemplate["mail-cfa-optout-invitation"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
            optOutLbaIntegrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_lba.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement?.siret_formateur,
            optOutActivatedAtDate: willBeActivatedAt.format("DD/MM"),
            linkToUnsubscribe: `${config.publicUrlEspacePro}/form/opt-out/unsubscribe/${etablissement._id}`,
          },
          user: {
            destinataireEmail: emailDecisionaire,
          },
        },
      })

      await etablissement.update({
        opt_mode: optMode.OPT_OUT,
        opt_out_invited_at: dayjs().toDate(),
        opt_out_will_be_activated_at: willBeActivatedAt.toDate(),
        $push: {
          mailing: {
            campaign: mailType.OPT_OUT_INVITE,
            status: null,
            message_id: messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      })

      let emails = formations.map((formation) => formation.email_rdv)
      if (etablissement?.etablissement_formateur_courriel) {
        emails.push(etablissement.etablissement_formateur_courriel)
      }

      emails = _(emails)
        .uniq(emails)
        .filter((email) => email !== etablissement.email_decisionnaire)
        .omitBy(_.isNil)

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
              },
              etablissement: {
                name: etablissement.raison_sociale,
                address: etablissement.adresse,
                postalCode: etablissement.code_postal,
                ville: etablissement.localite,
                siret: etablissement.siret_formateur,
                email: etablissement.email_decisionnaire,
                optOutActivatedAtDate: willBeActivatedAt.format("DD/MM"),
                emailGestionnaire: etablissement.email_decisionnaire,
              },
              user: {
                destinataireEmail: email,
              },
            },
          })
        )
      )

      logger.info("Etablissement invited to opt-out.", {
        siretFormateur: etablissement.siret_formateur,
        willBeActivatedAt: willBeActivatedAt.format(),
        emailDecisionaire,
      })
    }
  }

  logger.info("Cron #inviteEtablissementToOptOut done.")
}
