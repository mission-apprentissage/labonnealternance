import express from "express"
import passport from "passport"
import Joi from "joi"
import { Strategy as LocalAPIKeyStrategy } from "passport-localapikey"
import config from "../../../config.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"
import { dayjs } from "../../../common/utils/dayjs.js"

/**
 * @description Checks "Sendinblue" token.
 * @return {NextFunction}
 */
const checkWebhookToken = () => {
  passport.use(new LocalAPIKeyStrategy({}, async (token, done) => done(null, config.smtp.sendinblueToken === token ? { apiKey: token } : false)))

  return passport.authenticate("localapikey", { session: false, failWithError: true })
}

/**
 * @description Email controllers.
 * @param {Appointment} appointments
 * @param {Etablissement} etablissements
 * @return {Router}
 */
export default ({ appointments, etablissements }) => {
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

      const appointment = await appointments.findOne({
        $or: [
          {
            email_premiere_demande_candidat_message_id: messageId,
          },
          {
            email_premiere_demande_cfa_message_id: messageId,
          },
        ],
      })

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

      const [appointmentCandidatFound] = await appointments.find({
        "candidat_mailing.message_id": { $regex: messageId },
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

      const [appointmentCfaFound] = await appointments.find({ "cfa_mailing.message_id": { $regex: messageId } })

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
