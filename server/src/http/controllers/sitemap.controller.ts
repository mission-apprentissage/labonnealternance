import { zRoutes } from "shared/index"

import dayjs from "@/services/dayjs.service"
import { getSitemap } from "@/services/sitemap.service"

import { Server } from "../server"

export default function (server: Server) {
  server.get(
    "/sitemap-offers.xml",
    {
      schema: zRoutes.get["/sitemap-offers.xml"],
    },
    async (_req, res) => {
      const sitemap = await getSitemap()
      const lastModified = dayjs(sitemap.created_at).utc().toString()
      return res
        .status(200)
        .headers({
          "content-type": "text/xml",
          "last-modified": lastModified,
        })
        .send(sitemap.xml)
    }
  )
}
