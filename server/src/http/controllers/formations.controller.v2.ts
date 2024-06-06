import Boom from "boom"
import { zRoutes } from "shared"

import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { getFormationsParRegionQuery, getFormationsQuery, getFormationv2 } from "../../services/formation.service"
import { Server } from "../server"

const config = {
  rateLimit: {
    max: 7,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/formations",
    {
      schema: zRoutes.get["/formations"],
      onRequest: server.auth(zRoutes.get["/formations"]),
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
          api_path: "formationV2",
          training_count: result.results?.length,
          result_count: result.results?.length,
          response: "OK",
        })
      }
      return res.send(result)
    }
  )

  server.get(
    "/formations/min",
    {
      schema: zRoutes.get["/formations/min"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, romeDomain, caller, latitude, longitude, radius, diploma, options } = req.query
      const result = await getFormationsQuery({ romes, longitude, latitude, radius, diploma, romeDomain, caller, options, referer, isMinimalData: true })

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
          api_path: "formationV2min",
          training_count: result.results?.length,
          result_count: result.results?.length,
          response: "OK",
        })
      }
      return res.send(result)
    }
  )

  server.get(
    "/formations/formation/:id",
    {
      schema: zRoutes.get["/formations/formation/:id"],
      onRequest: server.auth(zRoutes.get["/formations/formation/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const { caller } = req.query
      const api_path = "/v2/formations/formation/:id"
      try {
        const formationOpt = await getFormationv2({ id })
        if (caller) {
          trackApiCall({
            caller,
            api_path,
            training_count: 1,
            result_count: 1,
            response: "OK",
          })
        }
        if (formationOpt) {
          return res.send(formationOpt)
        } else {
          throw Boom.notFound("formation introuvable")
        }
      } catch (err) {
        if (caller) {
          trackApiCall({ caller, api_path, response: "Error" })
        }
        throw err
      }
    }
  )
  server.get(
    "/formationsParRegion",
    {
      schema: zRoutes.get["/formationsParRegion"],
      onRequest: server.auth(zRoutes.get["/formationsParRegion"]),
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

        return res.send(result)
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

      return res.send(result)
    }
  )
}
