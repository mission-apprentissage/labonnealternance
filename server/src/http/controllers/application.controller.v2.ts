import { zRoutes } from "shared/index"

import { sendApplication } from "../../services/application.service"
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
      const result = await sendApplication({
        newApplication: req.body,
        referer: req.headers.referer as string,
      })

      if ("error" in result) {
        if (result.error === "error_sending_application") {
          res.status(500)
        } else {
          res.status(400)
        }
      } else {
        res.status(200)
      }

      return res.send(result)
    }
  )
}