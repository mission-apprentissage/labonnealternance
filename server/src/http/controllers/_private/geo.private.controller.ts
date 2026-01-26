import { zRoutes } from "shared/index"

import type { Server } from "@/http/server"
import { getNearestCommuneByGeoPoint } from "@/services/referentiel/commune/commune.referentiel.service"

export function geoRouteController(server: Server) {
  server.get(
    "/_private/geo/commune/reverse",
    {
      schema: zRoutes.get["/_private/geo/commune/reverse"],
    },
    async (req, res) => {
      return res.status(202).send(
        await getNearestCommuneByGeoPoint({
          type: "Point",
          coordinates: [req.query.longitude, req.query.latitude],
        })
      )
    }
  )
}
