import { zRoutes } from "shared/index"

import config from "@/config"

import { addEmailToBlacklist, removeEmailFromLbaCompanies } from "../../services/application.service"
import { BrevoEventStatus } from "../../services/brevo.service"
import { Server } from "../server"

export default function (server: Server) {
  server.post(
    "/campaign/webhook",
    {
      schema: zRoutes.post["/campaign/webhook"],
    },
    async (req, res) => {
      const { apikey } = req.query
      if (apikey !== config.smtp.brevoWebhookApiKey) {
        throw Boom.forbidden()
      }
      if (req.body.event === BrevoEventStatus.HARD_BOUNCE) {
        await Promise.all([addEmailToBlacklist(req.body.email, "campaign"), removeEmailFromLbaCompanies(req.body.email)])
      }

      return res.status(200).send({ result: "ok" })
    }
  )
}
