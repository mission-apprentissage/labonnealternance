import { zRoutes } from "shared/index"

import { getUserFromRequest } from "../../security/authenticationService"
import { sendApplicationV2 } from "../../services/application.service"
import { Server } from "../server"

export default function (server: Server) {
  server.post(
    "/application",
    {
      schema: zRoutes.post["/application"],
      onRequest: server.auth(zRoutes.post["/application"]),
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "5s",
        },
      },
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/application"]).value
      await sendApplicationV2({ newApplication: req.body, caller: user.organisation })
      return res.send("OK")
    }
  )
  server.post(
    "/_private/application",
    {
      schema: zRoutes.post["/_private/application"],
      onRequest: server.auth(zRoutes.post["/_private/application"]),
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "5s",
        },
      },
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      await sendApplicationV2({
        newApplication: req.body,
        caller: req.body.caller || undefined,
        source: { utm_campaign: req?.cookies["utm_campaign"], referer: req?.cookies["referer"] },
      })
      return res.status(200).send({})
    }
  )
}
