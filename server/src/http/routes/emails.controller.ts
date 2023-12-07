import Boom from "boom"
import { zRoutes } from "shared/index"

import config from "@/config"
import { processEstablishmentEvent } from "@/services/etablissement.service"

import { processApplicationEvent, processHardBounce } from "../../services/application.service"
import * as appointmentService from "../../services/appointment.service"
import { Server } from "../server"

const processWebhookEvent = async (payload) => {
  let shouldContinue = await processApplicationEvent(payload)
  if (!shouldContinue) return

  shouldContinue = await appointmentService.processAppointmentWebhookEvent(payload)
  if (!shouldContinue) return

  shouldContinue = await processEstablishmentEvent(payload)
  if (!shouldContinue) return

  shouldContinue = await appointmentService.processAppointmentToApplicantWebhookEvent(payload)
  if (!shouldContinue) return

  shouldContinue = await appointmentService.processAppointmentToCfaWebhookEvent(payload)
  if (!shouldContinue) return

  await processHardBounce(payload)
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
