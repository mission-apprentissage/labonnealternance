import Boom from "boom"
import { zRoutes } from "shared/index"

import config from "@/config"
import { processHardBounceWebhookEvent, processWebhookEvent } from "@/services/emails.service"

import { Server } from "../server"

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

  server.post(
    "/emails/webhookHardbounce",
    {
      schema: zRoutes.post["/emails/webhookHardbounce"],
    },
    async (req, res) => {
      if (req.query.apiKey !== config.smtp.brevoWebhookApiKey) {
        throw Boom.forbidden()
      }

      await processHardBounceWebhookEvent(req.body)

      return res.status(200).send({})
    }
  )
}
