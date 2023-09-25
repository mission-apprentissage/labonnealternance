import { zRoutes } from "shared/index.js"

import { trackApiCall } from "../../../common/utils/sendTrackingEvent.js"
import { getFormationsParRegionQuery } from "../../../services/formation.service.js"
import { Server } from "../../server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  // @Tags("Formations par région")
  // @OperationId("getFormations")
  server.post(
    "/api/v1/formationsParRegion",
    {
      schema: zRoutes.post["/api/v1/formationsParRegion"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { romes, romeDomain, caller, departement, region, diploma, options, useMock } = req.query
      const { referer } = req.headers

      const result = await getFormationsParRegionQuery({ romes, departement, region, diploma, romeDomain, caller, options, referer, useMock })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }

        return result
      }

      if (caller && "results" in result) {
        trackApiCall({
          caller: caller,
          api_path: "formationRegionV1",
          training_count: result.results?.length,
          result_count: result.results?.length,
          response: "OK",
        })
      }

      return result
    }
  )
}
