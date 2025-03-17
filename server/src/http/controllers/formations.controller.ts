import { internal, badRequest } from "@hapi/boom"
import { zRoutes } from "shared"

import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { getFormationByCleME, getFormationQuery, getFormationsQuery } from "../../services/formation.service"
import { Server } from "../server"

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
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, romeDomain, caller, latitude, longitude, radius, diploma, options } = req.query
      const result = await getFormationsQuery({ romes, longitude, latitude, radius, diploma, romeDomain, caller, options, referer, isMinimalData: false })

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
    "/v1/_private/formations/min",
    {
      schema: zRoutes.get["/v1/_private/formations/min"],
      config,
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, latitude, longitude, radius, diploma } = req.query
      const result = await getFormationsQuery({ romes, longitude, latitude, radius, diploma, referer, isMinimalData: true })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          throw badRequest()
        }

        throw internal("Failed to fetch formations min", { error: result.error })
      }

      return res.send(result.results)
    }
  )

  server.get(
    "/v1/formations/formation/:id",
    {
      schema: zRoutes.get["/v1/formations/formation/:id"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const { caller } = req.query
      try {
        const result = await getFormationQuery({ id })
        if (caller) {
          trackApiCall({
            caller,
            api_path: "formationV1/formation",
            training_count: 1,
            result_count: 1,
            response: "OK",
          })
        }
        return res.send(result)
      } catch (err) {
        if (caller) {
          trackApiCall({ caller, api_path: "formationV1/formation", response: "Error" })
        }
        throw err
      }
    }
  )

  server.get(
    "/_private/formations/:id",
    {
      schema: zRoutes.get["/_private/formations/:id"],
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const result = await getFormationByCleME(id)
      return res.send(result)
    }
  )
}
