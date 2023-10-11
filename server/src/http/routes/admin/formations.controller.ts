import { zRoutes } from "shared/index"

import { ServerBuilder } from "@/http/utils/serverBuilder"

import { getCatalogueFormations } from "../../../services/catalogue.service"

/**
 * @description Formations server.
 */
export default (server: ServerBuilder) => {
  /**
   * @description Get in formation collection.
   */
  server.get(
    {
      schema: zRoutes.get["/admin/formations"],
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
