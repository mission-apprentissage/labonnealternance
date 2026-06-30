import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { searchAlgolia } from "@/services/search/search.service"

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
}
