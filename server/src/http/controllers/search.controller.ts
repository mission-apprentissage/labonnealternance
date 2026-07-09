import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { searchAlgolia, suggestAlgolia } from "@/services/search/search.service"

export default (server: Server) => {
  server.get(
    "/v1/search",
    {
      schema: zRoutes.get["/v1/search"],
      config: { rateLimit: { max: 30, timeWindow: "1s" } },
    },
    async (req, res) => {
      const result = await searchAlgolia(req.query)
      return res.status(200).send(result)
    }
  )

  server.get(
    "/v1/search/suggest",
    {
      schema: zRoutes.get["/v1/search/suggest"],
      config: { rateLimit: { max: 60, timeWindow: "1s" } },
    },
    async (req, res) => {
      const result = await suggestAlgolia(req.query)
      return res.status(200).send(result)
    }
  )
}
