import Boom from "boom"
import { zRoutes } from "shared/index"

import config from "@/config"

import { logger } from "../../common/logger"
import { Etablissement } from "../../common/model"
import { addEmailToBlacklist, findApplicationByMessageId, removeEmailFromLbaCompanies, updateApplicationStatusFromHardbounce } from "../../services/application.service"
import * as appointmentService from "../../services/appointment.service"
import { BrevoEventStatus } from "../../services/brevo.service"
import dayjs from "../../services/dayjs.service"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../server"

const processWebhookEvent = async (payload) => {
  const { date, event, email } = payload
  const messageId = payload["message-id"]

  // application
  if (event === BrevoEventStatus.HARD_BOUNCE) {
    const application = await findApplicationByMessageId({
      messageId,
      email,
    })

    if (application) {
      await updateApplicationStatusFromHardbounce({ payload, application })
      return
    }
  }

  const eventDate = dayjs.utc(date).tz("Europe/Paris").toDate()

  // If mail sent from appointment model
  const appointment = await appointmentService.findOne({ "to_cfa_mails.message_id": { $regex: messageId } })
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

    return
  }

  // If mail sent from etablissement model
  const [etablissementFound] = await Etablissement.find({ "mailing.message_id": { $regex: messageId } })
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
    return
  }

  // If mail sent from appointment (to the candidat)
  const [appointmentCandidatFound] = await appointmentService.find({
    "to_applicant_mails.message_id": { $regex: messageId },
  })
  if (appointmentCandidatFound) {
    const previousEmail = appointmentCandidatFound?.to_applicant_mails?.find((mail) => mail.message_id.includes(messageId))

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
    return
  }

  // If mail sent from appointment (to the CFA)
  const [appointmentCfaFound] = await appointmentService.find({ "to_cfa_mails.message_id": { $regex: messageId } })
  if (appointmentCfaFound && appointmentCfaFound?.to_cfa_mails) {
    const previousEmail = appointmentCfaFound.to_cfa_mails.find((mail) => mail.message_id.includes(messageId))

    if (!previousEmail) {
      return
    }

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
    return
  }

  if (event === BrevoEventStatus.HARD_BOUNCE) {
    await Promise.all([addEmailToBlacklist(email, "campaign"), removeEmailFromLbaCompanies(email)])
  }
}
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
    "/emails/webhook",
    {
      schema: zRoutes.post["/emails/webhook"],
    },
    async (req, res) => {
      if (req.query.apiKey !== config.smtp.brevoWebhookApiKey) {
        throw Boom.forbidden()
      }

      await processWebhookEvent(req.body)

      return res.status(200).send({})
    }
  )
}
