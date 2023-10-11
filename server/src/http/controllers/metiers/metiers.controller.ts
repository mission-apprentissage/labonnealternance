import { zRoutes } from "shared/index.js"

import { ServerBuilder } from "@/http/utils/serverBuilder"

import { getCoupleAppellationRomeIntitule, getMetiers, getMetiersPourCfd, getMetiersPourEtablissement, getTousLesMetiers } from "../../../services/metiers.service"

export default (server: ServerBuilder) => {
  server.get(
    {
      schema: zRoutes.get["/v1/metiers/metiersParFormation/:cfd"],
    },
    async (req, res) => {
      const { cfd } = req.params
      const result = await getMetiersPourCfd({ cfd })
      return res.send(result)
    }
  )

  server.get(
    {
      schema: zRoutes.get["/v1/metiers/metiersParEtablissement/:siret"],
    },
    async (req, res) => {
      const { siret } = req.params
      const result = await getMetiersPourEtablissement({ siret })
      return res.send(result)
    }
  )

  server.get(
    {
      schema: zRoutes.get["/v1/metiers/all"],
    },
    async (req, res) => {
      const result = await getTousLesMetiers()
      return res.send(result)
    }
  )

  server.get(
    {
      schema: zRoutes.get["/v1/metiers"],
    },
    async (req, res) => {
      const { title, romes, rncps } = req.query
      const result = await getMetiers({ title, romes, rncps })
      return res.send(result)
    }
  )

  server.get(
    {
      schema: zRoutes.get["/v1/metiers/intitule"],
    },
    async (req, res) => {
      const { label } = req.query
      const result = await getCoupleAppellationRomeIntitule(label)
      return res.send(result)
    }
  )
}
