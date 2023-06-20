import express from "express"
import Joi from "joi"
import passport from "passport"
import { Strategy as LocalAPIKeyStrategy } from "passport-localapikey"
import { dayjs } from "../../../common/utils/dayjs.js"
import config from "../../../config.js"
import { addEmailToBlacklist } from "../../../services/application.service.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service.js"
import * as appointmentService from "../../../services/appointment.service.js"

/**
 * @description Checks "Sendinblue" token.
 * @return {NextFunction}
 */
const checkWebhookToken = () => {
  passport.use(new LocalAPIKeyStrategy({}, async (token, done) => done(null, config.smtp.sendinblueWebhookApiKey === token ? { apiKey: token } : false)))

  return passport.authenticate("localapikey", { session: false, failWithError: true })
}

/**
 * Email controllers.
 */
export default ({ etablissements }) => {
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

      const [appointment] = await appointmentService.find({ "to_cfa_mails.message_id": { $regex: messageId } })

      // If mail sent from appointment model
      if (appointment) {
        if (appointment.email_premiere_demande_candidat_message_id === messageId) {
          await appointments.updateAppointment(appointment._id, {
            email_premiere_demande_candidat_statut: parameters.event,
            email_premiere_demande_cfa_statut_date: eventDate,
          })
        } else if (appointment.email_premiere_demande_cfa_message_id === messageId) {
          await appointments.updateAppointment(appointment._id, {
            email_premiere_demande_cfa_statut: parameters.event,
            email_premiere_demande_candidat_statut_date: eventDate,
          })

          // Disable widgetParameters in case of hard_bounce
          if (parameters.event === SendinblueEventStatus.HARD_BOUNCE) {
            const widgetParametersWithEmail = await widgetParameters.find({ email_rdv: appointment.email_cfa })

        // Disable eligibleTrainingsForAppointments in case of hard_bounce
        if (parameters.event === SendinblueEventStatus.HARD_BOUNCE) {
          const eligibleTrainingsForAppointmentsWithEmail = await eligibleTrainingsForAppointmentService.find({ cfa_recipient_email: appointment.cfa_recipient_email })

                logger.info('Widget parameters disabled for "hard_bounce" reason', { widgetParameterId: widgetParameter._id, email: appointment.email_cfa })
              })
            )
            await addEmailToBlacklist(appointment.email_cfa, "rdv-transactional")
          }
        }
      }

      const [etablissementFound] = await etablissements.find({ "mailing.message_id": { $regex: messageId } })

      // If mail sent from etablissement model
      if (etablissementFound) {
        const previousEmail = etablissementFound.mailing.find((mail) => mail.message_id.includes(messageId))

        await etablissementFound.update({
          $push: {
            mailing: {
              campaign: previousEmail.campaign,
              status: parameters.event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })
      }

      const [appointmentCandidatFound] = await appointmentService.find({
        "to_applicant_mails.message_id": { $regex: messageId },
      })

      // If mail sent from appointment (to the candidat)
      if (appointmentCandidatFound) {
        const previousEmail = appointmentCandidatFound.mailing.find((mail) => mail.message_id.includes(messageId))

        await appointmentCandidatFound.update({
          $push: {
            candidat_mailing: {
              campaign: previousEmail.campaign,
              status: parameters.event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })
      }

      const [appointmentCfaFound] = await appointmentService.find({ "to_cfa_mails.message_id": { $regex: messageId } })

      // If mail sent from appointment (to the CFA)
      if (appointmentCfaFound && appointmentCfaFound?.mailing) {
        const previousEmail = appointmentCfaFound.mailing.find((mail) => mail.message_id.includes(messageId))

        await appointmentCfaFound.update({
          $push: {
            cfa_mailing: {
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
