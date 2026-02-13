import { zRoutes } from "shared"

import { fetchInserJeunesStats } from "@/common/apis/inserjeunes/inserjeunes.client"
import type { Server } from "@/http/server"

const config = {
  rateLimit: {
    max: 50,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/inserjeunes/:zipcode/:cfd",
    {
      schema: zRoutes.get["/inserjeunes/:zipcode/:cfd"],
      config,
    },
    async (req, res) => {
      const { zipcode, cfd } = req.params

      const result = await fetchInserJeunesStats(zipcode, cfd)

      if (result === null) {
        res.status(404)
        return { statusCode: 404, error: "Not Found", message: "Pas de données disponibles" }
      }

      return result
    }
  )
}
