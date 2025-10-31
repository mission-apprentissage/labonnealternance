import { zRoutes } from "shared/index"

import { getSeoVille } from "@/services/seo.service"

import { Server } from "../../server"

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
}
