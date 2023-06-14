import express from "express"
import Joi from "joi"
import passport from "passport"
import { Strategy as LocalAPIKeyStrategy } from "passport-localapikey"
import { logger } from "../../../common/logger.js"
import { SendinblueEventStatus } from "../../../common/sendinblue.js"
import { dayjs } from "../../../common/utils/dayjs.js"
import config from "../../../config.js"
import { addEmailToBlacklist } from "../../../services/application.service.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

/**
 * @description Checks "Sendinblue" token.
 * @return {NextFunction}
 */
const checkWebhookToken = () => {
  passport.use(new LocalAPIKeyStrategy({}, async (token, done) => done(null, config.smtp.sendinblueWebhookApiKey === token ? { apiKey: token } : false)))

  return passport.authenticate("localapikey", { session: false, failWithError: true })
}

/**
 * @description Email controllers.
 * @param {Appointment} appointments
 * @param {Etablissement} etablissements
 * @param {EligibleTrainingsForAppointment} eligibleTrainingsForAppointments
 * @return {Router}
 */
export default ({ appointments, etablissements, eligibleTrainingsForAppointments }) => {
  const router = express.Router()

  /**
   * @description Update email status.
   * @method {POST}
   * @returns {Promise<void>}
   */
  router.post(
    "/webhook",
    checkWebhookToken(),
    tryCatch(async (req, res) => {
      const parameters = await Joi.object({
        event: Joi.string().required(),
        "message-id": Joi.string().required(),
        date: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.body, { abortEarly: false })

      const messageId = parameters["message-id"]
      const eventDate = dayjs.utc(parameters["date"]).tz("Europe/Paris").toDate()

      const [appointment] = await appointments.find({ "to_cfa_mails.message_id": { $regex: messageId } })

      // If mail sent from appointment model
      if (appointment) {
        const previousEmail = appointment.to_cfa_mails.find((mail) => mail.message_id.includes(messageId))

        await appointment.update({
          $push: {
            to_etablissement_emails: {
              campaign: previousEmail.campaign,
              status: parameters.event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })

        // Disable eligibleTrainingsForAppointments in case of hard_bounce
        if (parameters.event === SendinblueEventStatus.HARD_BOUNCE) {
          const eligibleTrainingsForAppointmentsWithEmail = await eligibleTrainingsForAppointments.find({ cfa_recipient_email: appointment.cfa_recipient_email })

          await Promise.all(
            eligibleTrainingsForAppointmentsWithEmail.map(async (eligibleTrainingsForAppointment) => {
              await eligibleTrainingsForAppointment.update({ referrers: [] })

              logger.info('Widget parameters disabled for "hard_bounce" reason', {
                eligibleTrainingsForAppointmentId: eligibleTrainingsForAppointment._id,
                cfa_recipient_email: appointment.cfa_recipient_email,
              })
            })
          )
          await addEmailToBlacklist(appointment.cfa_recipient_email, "rdv-transactional")
        }
      }

      const [etablissementFound] = await etablissements.find({ "mailing.message_id": { $regex: messageId } })

      // If mail sent from etablissement model
      if (etablissementFound) {
        const previousEmail = etablissementFound.to_etablissement_emails.find((mail) => mail.message_id.includes(messageId))

        await etablissementFound.update({
          $push: {
            to_etablissement_emails: {
              campaign: previousEmail.campaign,
              status: parameters.event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })
      }

      const [appointmentCandidatFound] = await appointments.find({
        "to_applicant_mails.message_id": { $regex: messageId },
      })

      // If mail sent from appointment (to the candidat)
      if (appointmentCandidatFound) {
        const previousEmail = appointmentCandidatFound.to_applicant_mails.find((mail) => mail.message_id.includes(messageId))

        await appointmentCandidatFound.update({
          $push: {
            to_applicant_mails: {
              campaign: previousEmail.campaign,
              status: parameters.event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })
      }

      const [appointmentCfaFound] = await appointments.find({ "to_cfa_mails.message_id": { $regex: messageId } })

      // If mail sent from appointment (to the CFA)
      if (appointmentCfaFound && appointmentCfaFound?.to_cfa_mails) {
        const previousEmail = appointmentCfaFound.to_cfa_mails.find((mail) => mail.message_id.includes(messageId))

        await appointmentCfaFound.update({
          $push: {
            to_cfa_mails: {
              campaign: previousEmail.campaign,
              status: parameters.event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })
      }

      return res.json({})
    })
  )

  return router
}
