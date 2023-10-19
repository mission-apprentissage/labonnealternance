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

      const response = await getCatalogueFormations({
        $or: [
          { etablissement_formateur_siret: search_item },
          { etablissement_formateur_uai: search_item },
          { id_rco_formation: search_item },
          { cle_ministere_educatif: search_item },
        ],
      })

      return res.send(response)
    }
  )
}
