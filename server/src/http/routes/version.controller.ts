import { zRoutes } from "shared/index"

import config from "@/config"

import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/api/version",
    {
      schema: zRoutes.get["/api/version"],
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
