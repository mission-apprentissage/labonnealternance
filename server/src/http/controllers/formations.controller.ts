import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { getFormationDetailByCleME } from "@/services/formation.service"

const config = {
  rateLimit: {
    max: 7,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/_private/formations/:id",
    {
      schema: zRoutes.get["/_private/formations/:id"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const result = await getFormationDetailByCleME(id)
      return res.send(result)
    }
  )
}
