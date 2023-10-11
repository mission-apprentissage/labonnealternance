import { zRoutes } from "shared/index"

import { addEmailToBlacklist, removeEmailFromLbaCompanies } from "../../services/application.service"
import { BrevoEventStatus } from "../../services/brevo.service"
import { ServerBuilder } from "../utils/serverBuilder"

export default function (server: ServerBuilder) {
  server.post(
    {
      schema: zRoutes.post["/campaign/webhook"],
    },
    async (req, res) => {
      /* Format payload
      {
        req.body.event : "hard_bounce",
        req.body.email:"john.doe@mail.com",
        ...
      }*/
      if (req.body.event === BrevoEventStatus.HARD_BOUNCE) {
        await Promise.all([addEmailToBlacklist(req.body.email, "campaign"), removeEmailFromLbaCompanies(req.body.email)])
      }

      return res.status(200).send({ result: "ok" })
    }
  )
}
