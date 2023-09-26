import { zRoutes } from "shared/index"

import { sendApplication } from "../../services/application.service"
import { Server } from "../server"

export default function (server: Server) {
  server.post(
    "/api/V1/application",
    {
      schema: zRoutes.post["/api/V1/application"],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "5s",
        },
      },
    },
    async (req, res) => {
      const result = await sendApplication({
        shouldCheckSecret: req.body.secret ? true : false,
        query: req.body,
        referer: req.headers.referer,
      })

      if (result.error) {
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
