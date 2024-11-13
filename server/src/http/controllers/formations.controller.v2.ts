import { notFound } from "@hapi/boom"
import { zRoutes } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { getFormationsParRegionV2, getFormationsV2, getFormationv2 } from "../../services/formation.service"
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
      const result = await getFormationsV2({ api: "/formations", romes, longitude, latitude, radius, diploma, romeDomain, caller, options, referer, isMinimalData: false })
      return res.send(result)
    }
  )

  server.get(
    "/formations/min",
    {
      schema: zRoutes.get["/formations/min"],
      onRequest: server.auth(zRoutes.get["/formations/min"]),
      config,
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, romeDomain, caller, latitude, longitude, radius, diploma, options } = req.query
      const result = await getFormationsV2({ api: "/formations/min", romes, longitude, latitude, radius, diploma, romeDomain, caller, options, referer, isMinimalData: true })
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
        if (formationOpt) {
          if (caller) {
            trackApiCall({
              caller,
              api_path,
              training_count: 1,
              result_count: 1,
              response: "OK",
            })
          }
          return res.send(formationOpt)
        } else {
          throw notFound(BusinessErrorCodes.TRAINING_NOT_FOUND)
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
      const result = await getFormationsParRegionV2({
        apiPath: "/formationsParRegion",
        romes,
        departement,
        region,
        diploma,
        romeDomain,
        caller,
        withDescription: options === "with_description",
        referer,
      })
      return res.send(result)
    }
  )
}
