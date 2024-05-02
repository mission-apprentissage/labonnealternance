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
}
