import { zRoutes } from "shared/index"

import type { Server } from "@/http/server"
import { getSeoMetier, getSeoVille } from "@/services/seo.service"

export function seoRouteController(server: Server) {
  server.get(
    "/_private/seo/ville/:ville",
    {
      schema: zRoutes.get["/_private/seo/ville/:ville"],
    },
    async (req, res) => {
      const { ville } = req.params

      const data = await getSeoVille({ ville })
      return res.status(200).send(data)
    }
  )

  server.get(
    "/_private/seo/metier/:metier",
    {
      schema: zRoutes.get["/_private/seo/metier/:metier"],
    },
    async (req, res) => {
      const { metier } = req.params

      const data = await getSeoMetier({ metier })
      return res.status(200).send(data)
    }
  )
}
