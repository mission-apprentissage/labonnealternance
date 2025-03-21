import { notFound } from "@hapi/boom"
import { zRoutes } from "shared/index"

import { getRomeDetailsFromDB } from "@/services/rome.service"

import { getRomesAndLabelsFromTitleQuery } from "../../services/metiers.service"
import { Server } from "../server"

/**
 * API romes
 */
export default function (server: Server) {
  server.get(
    "/rome",
    {
      schema: zRoutes.get["/rome"],
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).header("Cache-Control", "public, max-age=604800, s-maxage=604800, stale-while-revalidate=3600").send(result)
    }
  )

  server.get(
    "/rome/detail/:rome",
    {
      schema: zRoutes.get["/rome/detail/:rome"],
    },
    async (req, res) => {
      const { rome } = req.params
      const romeData = await getRomeDetailsFromDB(rome)
      if (!romeData) {
        throw notFound(`rome ${rome} not found`)
      }
      return res.status(200).send(romeData)
    }
  )
}
