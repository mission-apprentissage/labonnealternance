import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { listPublicNewsletters } from "@/services/newsletter.service"

export default (server: Server) => {
  server.get(
    "/newsletters",
    {
      schema: zRoutes.get["/newsletters"],
    },
    async (_req, res) => {
      const newsletters = await listPublicNewsletters()
      return res.status(200).header("Cache-Control", "public, max-age=60").send({ newsletters })
    }
  )
}
