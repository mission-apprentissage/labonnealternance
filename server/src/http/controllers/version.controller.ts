import { zRoutes } from "shared/index"

import type { Server } from "@/http/server"
import config from "@/config"


export default (server: Server) => {
  server.get(
    "/version",
    {
      schema: zRoutes.get["/version"],
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "1s",
        },
      },
    },
    async (_req, res) => {
      return res.status(200).send({ version: config.version })
    }
  )
}
