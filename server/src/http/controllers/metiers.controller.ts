import { zRoutes } from "shared"

import { getCoupleAppellationRomeIntitule, getMetiers, getMetiersPourCfd, getTousLesMetiers } from "../../services/metiers.service"
import { Server } from "../server"

const config = {
  rateLimit: {
    max: 20,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/v1/metiers/metiersParFormation/:cfd",
    {
      schema: zRoutes.get["/v1/metiers/metiersParFormation/:cfd"],
      config,
    },
    async (req, res) => {
      const { cfd } = req.params
      const result = await getMetiersPourCfd({ cfd })
      return res.send(result)
    }
  )

  server.get(
    "/v1/metiers/all",
    {
      schema: zRoutes.get["/v1/metiers/all"],
      config,
    },
    async (req, res) => {
      const result = await getTousLesMetiers()
      return res.send(result)
    }
  )

  server.get(
    "/v1/metiers",
    {
      schema: zRoutes.get["/v1/metiers"],
      config,
    },
    async (req, res) => {
      const { title, romes, rncps } = req.query
      const result = await getMetiers({ title, romes, rncps })
      return res.send(result)
    }
  )

  server.get(
    "/v1/metiers/intitule",
    {
      schema: zRoutes.get["/v1/metiers/intitule"],
      config,
    },
    async (req, res) => {
      const { label } = req.query
      const result = await getCoupleAppellationRomeIntitule(label)
      return res.send(result)
    }
  )
}
