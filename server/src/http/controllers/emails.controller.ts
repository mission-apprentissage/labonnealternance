import { forbidden } from "@hapi/boom"
import { zRoutes } from "shared/index"
import config from "@/config"
import type { Server } from "@/http/server"
import type { IBrevoWebhookEvent } from "@/services/emails.service"
import { processHardBounceWebhookEvent, processWebhookEvent } from "@/services/emails.service"

export default (server: Server) => {
  // Webhook Brevo : mise à jour du statut des emails envoyés
  server.post(
    "/emails/webhook",
    {
      schema: zRoutes.post["/emails/webhook"],
    },
    async (req, res) => {
      if (req.query.apiKey !== config.smtp.brevoWebhookApiKey) {
        throw forbidden()
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
        throw forbidden()
      }

      await processHardBounceWebhookEvent(req.body as IBrevoWebhookEvent)

      return res.status(200).send({})
    }
  )
}
