import { zRoutes } from "shared"

import { fetchInserJeuneStats } from "@/common/apis/inserjeune/inserjeune.client"
import type { Server } from "@/http/server"

const config = {
  rateLimit: {
    max: 50,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/inserjeune/:zipcode/:cfd",
    {
      schema: zRoutes.get["/inserjeune/:zipcode/:cfd"],
      config,
    },
    async (req, res) => {
      const { zipcode, cfd } = req.params

      const result = await fetchInserJeuneStats(zipcode, cfd)

      if (result === null) {
        res.status(404)
        return { error: "Pas de données disponibles" }
      }

      return result
    }
  )
}
