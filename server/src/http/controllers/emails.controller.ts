import Boom from "boom"
import { zRoutes } from "shared/index"

import config from "@/config"
import { processApplicationWebhookEvent, processHardBounceWebhookEvent } from "@/services/application.service"
import { processAppointmentToApplicantWebhookEvent, processAppointmentToCfaWebhookEvent } from "@/services/appointment.service"
import { processEstablishmentWebhookEvent } from "@/services/etablissement.service"

import { Server } from "../server"

const processWebhookEvent = async (payload) => {
  let shouldContinue = await processApplicationWebhookEvent(payload)
  if (!shouldContinue) return

  shouldContinue = await processAppointmentToCfaWebhookEvent(payload)
  if (!shouldContinue) return

  shouldContinue = await processAppointmentToApplicantWebhookEvent(payload)
  if (!shouldContinue) return

  shouldContinue = await processEstablishmentWebhookEvent(payload)
  if (!shouldContinue) return

  await processHardBounceWebhookEvent(payload)
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
