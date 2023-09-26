import { zRoutes } from "shared/index"

import { getCatalogueFormations } from "../../../services/catalogue.service"
import { Server } from "../../server"

/**
 * @description Formations server.
 */
export default (server: Server) => {
  /**
   * @description Get in formation collection.
   */
  server.get(
    "/api/admin/formations",
    {
      schema: zRoutes.get["/api/admin/formations"],
      preHandler: [server.auth(zRoutes.get["/api/admin/formations"].securityScheme)],
    },
    async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}

      const response = await getCatalogueFormations(query)

      return res.send(response)
    }
  )
}
