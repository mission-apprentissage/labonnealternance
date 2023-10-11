import Boom from "boom"
import { zRoutes } from "shared/index"

import { ServerBuilder } from "@/http/utils/serverBuilder"
import { getRomeDetailsFromAPI } from "@/services/rome.service"

import { getRomesAndLabelsFromTitleQuery } from "../../../services/metiers.service"

// TODO: Remove duplicated routes
export default function (server: ServerBuilder) {
  server.get(
    {
      schema: zRoutes.get["/rome"],
      aliases: ["/romelabels"],
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).send(result)
    }
  )

  server.get(
    {
      schema: zRoutes.get["/rome/detail/:rome"],
      aliases: ["/romelabels/detail/:rome"],
    },
    async (req, res) => {
      const { rome } = req.params
      const romeData = await getRomeDetailsFromAPI(rome)
      if (!romeData) {
        throw Boom.notFound(`rome ${rome} not found`)
      }
      return res.status(200).send(romeData)
    }
  )
}
