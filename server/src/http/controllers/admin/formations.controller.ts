import { badRequest } from "@hapi/boom"
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
    "/admin/formations",
    {
      schema: zRoutes.get["/admin/formations"],
      onRequest: [server.auth(zRoutes.get["/admin/formations"])],
    },
    async (req, res) => {
      const { search_item } = req.query

      if (!search_item) {
        throw badRequest("Invalid search_item.")
      }

      const searchItemDecoded = decodeURIComponent(search_item)

      const response = await getCatalogueFormations({
        $or: [
          { etablissement_formateur_siret: searchItemDecoded },
          { etablissement_formateur_uai: searchItemDecoded },
          { id_rco_formation: searchItemDecoded },
          { cle_ministere_educatif: searchItemDecoded },
        ],
      })

      return res.send(response)
    }
  )
}
