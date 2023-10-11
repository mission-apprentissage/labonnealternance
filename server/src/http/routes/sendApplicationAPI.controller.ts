import { zRoutes } from "shared/index"

import { sendApplication } from "../../services/application.service"
import { ServerBuilder } from "../utils/serverBuilder"

export default function (server: ServerBuilder) {
  server.post(
    {
      schema: zRoutes.post["/v1/application"],
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      const result = await sendApplication({
        shouldCheckSecret: req.body.secret ? true : false,
        query: req.body,
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
