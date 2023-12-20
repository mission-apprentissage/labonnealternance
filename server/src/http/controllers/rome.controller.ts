import Boom from "boom"
import { zRoutes } from "shared/index"

import { getRomeDetailsFromDB } from "@/services/rome.service"

import { getRomesAndLabelsFromTitleQuery } from "../../services/metiers.service"
import { Server } from "../server"

// TODO: Remove duplicated routes
/**
 * API romes
 */
export default function (server: Server) {
  server.get(
    "/romelabels",
    {
      schema: zRoutes.get["/rome"],
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).send(result)
    }
  )

  server.get(
    "/rome",
    {
      schema: zRoutes.get["/rome"],
    },
    async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.status(200).send(result)
    }
  )

  server.get(
    "/romelabels/detail/:rome",
    {
      schema: zRoutes.get["/rome/detail/:rome"],
    },
    async (req, res) => {
      const { rome } = req.params
      const romeData = await getRomeDetailsFromDB(rome)
      if (!romeData) {
        throw Boom.notFound(`rome ${rome} not found`)
      }
      return res.status(200).send(romeData.fiche_metier)
    }
  )

  server.get(
    "/rome/detail/:rome",
    {
      schema: zRoutes.get["/rome/detail/:rome"],
    },
    async (req, res) => {
      const { rome } = req.params
      const romeData = await getRomeDetailsFromDB(rome)
      if (!romeData) {
        throw Boom.notFound(`rome ${rome} not found`)
      }
      return res.status(200).send(romeData.fiche_metier)
    }
  )
}
