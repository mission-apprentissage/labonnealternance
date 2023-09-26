import Joi from "joi"
import { zRoutes } from "shared/index"

import { logger } from "../../../common/logger"
import { Etablissement } from "../../../common/model"
import { addEmailToBlacklist } from "../../../services/application.service"
import * as appointmentService from "../../../services/appointment.service"
import { BrevoEventStatus } from "../../../services/brevo.service"
import dayjs from "../../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

/**
 * Email controllers.
 */
export default (server: Server) => {
  /**
   * @description Update email status.
   * @method {POST}
   * @returns {Promise<void>}
   */
  server.post(
    "/api/emails/webhook",
    {
      schema: zRoutes.post["/api/emails/webhook"],
      preHandler: server.auth(zRoutes.post["/api/emails/webhook"].securityScheme),
    },
    async (req, res) => {
      const { date, event } = req.body
      const messageId = req.body["message-id"]
      const eventDate = dayjs.utc(date).tz("Europe/Paris").toDate()

      const appointment = await appointmentService.findOne({ "to_cfa_mails.message_id": { $regex: messageId } })

      // If mail sent from appointment model
      if (appointment) {
        const previousEmail = appointment.to_cfa_mails.find((mail) => mail.message_id.includes(messageId))

        if (!previousEmail) return

        await appointment.update({
          $push: {
            to_etablissement_emails: {
              campaign: previousEmail.campaign,
              status: event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })

        // Disable eligibleTrainingsForAppointments in case of hard_bounce
        if (event === BrevoEventStatus.HARD_BOUNCE) {
          const eligibleTrainingsForAppointmentsWithEmail = await eligibleTrainingsForAppointmentService.find({ cfa_recipient_email: appointment.cfa_recipient_email })

          await Promise.all(
            eligibleTrainingsForAppointmentsWithEmail.map(async (eligibleTrainingsForAppointment) => {
              await eligibleTrainingsForAppointment.update({ referrers: [] })

              logger.info('Widget parameters disabled for "hard_bounce" reason', {
                eligibleTrainingsForAppointmentId: eligibleTrainingsForAppointment._id,
                cfa_recipient_email: appointment.cfa_recipient_email,
              })
            })
          )
          await addEmailToBlacklist(appointment.cfa_recipient_email as string, "rdv-transactional")
        }
      }

      const [etablissementFound] = await Etablissement.find({ "mailing.message_id": { $regex: messageId } })

      // If mail sent from etablissement model
      if (etablissementFound) {
        const previousEmail = etablissementFound?.to_etablissement_emails?.find((mail) => mail?.message_id?.includes(messageId))

        await etablissementFound.update({
          $push: {
            to_etablissement_emails: {
              campaign: previousEmail?.campaign,
              status: event,
              message_id: previousEmail?.message_id,
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
        const previousEmail = appointmentCandidatFound.to_applicant_mails.find((mail) => mail.message_id.includes(messageId))

        if (!previousEmail) return

        await appointmentCandidatFound.update({
          $push: {
            to_applicant_mails: {
              campaign: previousEmail.campaign,
              status: event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })
      }

      const [appointmentCfaFound] = await appointmentService.find({ "to_cfa_mails.message_id": { $regex: messageId } })

      // If mail sent from appointment (to the CFA)
      if (appointmentCfaFound && appointmentCfaFound?.to_cfa_mails) {
        const previousEmail = appointmentCfaFound.to_cfa_mails.find((mail) => mail.message_id.includes(messageId))

        if (!previousEmail) return

        await appointmentCfaFound.update({
          $push: {
            to_cfa_mails: {
              campaign: previousEmail.campaign,
              status: event,
              message_id: previousEmail.message_id,
              webhook_status_at: eventDate,
            },
          },
        })
      }

      return res.status(200).send({})
    }
  )
}
