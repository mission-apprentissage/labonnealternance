import { zRoutes } from "shared/index"

import type { Server } from "@/http/server"
import { getCoupleAppellationRomeIntitule } from "@/services/metiers.service"

export function metiersRouteController(server: Server) {
  server.get(
    "/_private/metiers/intitule",
    {
      schema: zRoutes.get["/_private/metiers/intitule"],
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1s",
        },
      },
    },
    async (req, res) => {
      const { label } = req.query
      const result = await getCoupleAppellationRomeIntitule(label)
      return res.send(result)
    }
  )
}
