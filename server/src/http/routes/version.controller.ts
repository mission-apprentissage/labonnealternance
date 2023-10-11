import { zRoutes } from "shared/index"

import config from "@/config"

import { ServerBuilder } from "../utils/serverBuilder"

export default (server: ServerBuilder) => {
  server.get(
    {
      schema: zRoutes.get["/version"],
    },
    async (_req, res) => {
      return res.status(200).send({ version: config.version })
    }
  )
}
