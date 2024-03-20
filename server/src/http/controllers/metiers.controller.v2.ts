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
    "/metiers/metiersParFormation/:cfd",
    {
      schema: zRoutes.get["/metiers/metiersParFormation/:cfd"],
      onRequest: server.auth(zRoutes.get["/metiers/metiersParFormation/:cfd"]),
      config,
    },
    async (req, res) => {
      const { cfd } = req.params
      const result = await getMetiersPourCfd({ cfd })
      return res.send(result)
    }
  )

  server.get(
    "/metiers/all",
    {
      schema: zRoutes.get["/metiers/all"],
      onRequest: server.auth(zRoutes.get["/metiers/all"]),
      config,
    },
    async (req, res) => {
      const result = await getTousLesMetiers()
      return res.send(result)
    }
  )

  server.get(
    "/metiers",
    {
      schema: zRoutes.get["/metiers"],
      onRequest: server.auth(zRoutes.get["/metiers"]),
      config,
    },
    async (req, res) => {
      const { title, romes, rncps } = req.query
      const result = await getMetiers({ title, romes, rncps })
      return res.send(result)
    }
  )

  server.get(
    "/metiers/intitule",
    {
      schema: zRoutes.get["/metiers/intitule"],
      onRequest: server.auth(zRoutes.get["/metiers/intitule"]),
      config,
    },
    async (req, res) => {
      const { label } = req.query
      const result = await getCoupleAppellationRomeIntitule(label)
      return res.send(result)
    }
  )
}
