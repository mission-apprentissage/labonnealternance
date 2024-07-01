import { zRoutes } from "shared"

import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { getFormationsParRegionQuery } from "../../services/formation.service"
import { Server } from "../server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/v1/formationsParRegion",
    {
      schema: zRoutes.get["/v1/formationsParRegion"],
      config,
    },
    async (req, res) => {
      const { romes, romeDomain, caller, departement, region, diploma, options } = req.query
      const { referer } = req.headers

      const result = await getFormationsParRegionQuery({ romes, departement, region, diploma, romeDomain, caller, options, referer })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }

        return result
      }

      if (caller) {
        trackApiCall({
          caller: caller,
          api_path: "formationRegionV1",
          training_count: result.results.length,
          result_count: result.results.length,
          response: "OK",
        })
      }

      return result
    }
  )
}
