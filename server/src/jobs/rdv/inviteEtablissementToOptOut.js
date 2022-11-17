import { logger } from "../../common/logger.js"
import { mailType, optMode } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import config from "../../config.js"
import { mailTemplate } from "../../assets/index.js"

/**
 * @description Invite all "etablissements" without opt_mode to opt-out.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToOptOut = async ({ etablissements, widgetParameters, mailer }) => {
  logger.info("Cron #inviteEtablissementToOptOut started.")

  // Opt-out etablissement to activate
  const etablissementsWithouOptMode = await etablissements.find({
    opt_mode: null,
    email_decisionnaire: {
      $ne: null,
    },
  })

  for (const etablissement of etablissementsWithouOptMode) {
    const formations = await widgetParameters.find({
      etablissement_siret: etablissement.siret_formateur,
    })

    let emailDecisionaire = etablissement.email_decisionnaire

    // If etablissement haven't a valid "email_decisionnaire"
    if (!etablissement.email_decisionnaire || !isValidEmail(emailDecisionaire)) {
      // If "email_rdv" exists, add 1 occurrence, otherwise set counter to 1
      const emailCounter = {}
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
    if (["production", "local"].includes(config.env) && emailDecisionaire) {
      const willBeActivatedAt = dayjs().add(15, "days").format()
      const optOutWillBeActivatedAtDayjs = dayjs(willBeActivatedAt)

      const { messageId } = await mailer.sendEmail({
        to: emailDecisionaire,
        subject: `Améliorer le sourcing de vos candidats !`,
        template: mailTemplate["mail-cfa-optout-invitation"],
        data: {
          images: {
            logoCfa: `${config.publicUrl}/espace-pro/assets/logo-lba-recruteur-cfa.png?raw=true`,
            logoFooter: `${config.publicUrl}/espace-pro/assets/logo-republique-francaise.png?raw=true`,
            peopleLaptop: `${config.publicUrl}/espace-pro/assets/people-laptop.png?raw=true`,
            optOutLbaIntegrationExample: `${config.publicUrl}/espace-pro/assets/exemple_integration_lba.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement?.siret_formateur,
            optOutActivatedAtDate: optOutWillBeActivatedAtDayjs.format("DD/MM"),
            linkToUnsubscribe: `${config.publicUrl}/espace-pro/form/opt-out/unsubscribe/${etablissement._id}`,
          },
          user: {
            destinataireEmail: emailDecisionaire,
          },
        },
        from: config.rdvEmail,
      })

      await etablissements.updateOne(
        { siret_formateur: etablissement.siret_formateur },
        {
          opt_mode: optMode.OPT_OUT,
          opt_out_invited_at: dayjs().toDate(),
          opt_out_will_be_activated_at: optOutWillBeActivatedAtDayjs.toDate(),
          $push: {
            mailing: {
              campaign: mailType.OPT_OUT_INVITE,
              status: null,
              message_id: messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
        }
      )

      logger.info("Etablissement invited to opt-out.", {
        siretFormateur: etablissement.siret_formateur,
        willBeActivatedAt,
        emailDecisionaire,
      })
    }
  }

  logger.info("Cron #inviteEtablissementToOptOut done.")
}
