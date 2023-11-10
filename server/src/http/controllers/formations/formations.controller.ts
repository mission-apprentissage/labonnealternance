import { zRoutes } from "shared/index.js"

import { trackApiCall } from "../../../common/utils/sendTrackingEvent.js"
import { getFormationQuery, getFormationsQuery } from "../../../services/formation.service.js"
import { Server } from "../../server"

const config = {
  rateLimit: {
    max: 7,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/v1/formations",
    {
      schema: zRoutes.get["/v1/formations"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, romeDomain, caller, latitude, longitude, radius, diploma, options } = req.query
      const result = await getFormationsQuery({ romes, longitude, latitude, radius, diploma, romeDomain, caller, options, referer })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }

        return res.send(result)
      }

      if (caller && "results" in result) {
        trackApiCall({
          caller: caller,
          api_path: "formationV1",
          training_count: result.results?.length,
          result_count: result.results?.length,
          response: "OK",
        })
      }
      return res.send(result)
    }
  )

  server.get(
    "/v1/formations/formation/:id",
    {
      schema: zRoutes.get["/v1/formations/formation/:id"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { id } = req.params
      const { caller } = req.query
      const result = await getFormationQuery({
        id,
        caller,
      })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(500)
        }
      } else {
        if (caller) {
          trackApiCall({
            caller,
            api_path: "formationV1/formation",
            training_count: 1,
            result_count: 1,
            response: "OK",
          })
        }
      }

      return res.send(result)
    }
  )
}
