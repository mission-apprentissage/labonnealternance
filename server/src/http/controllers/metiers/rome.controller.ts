import { zRoutes } from "shared/index"

import { getRomesAndLabelsFromTitleQuery } from "../../../services/metiers.service"
import { Server } from "../../server"

const config = {
  rateLimit: {
    max: 10,
    timeWindow: "1s",
  },
}

export default function (server: Server) {
  // TODO: Remove duplicated routes

  server.get(
    "/api/romelabels",
    {
      schema: zRoutes.get["/api/romelabels"],
      config,
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).send(result)
    }
  )
  server.get(
    "/api/rome",
    {
      schema: zRoutes.get["/api/rome"],
      config,
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).send(result)
    }
  )
}
