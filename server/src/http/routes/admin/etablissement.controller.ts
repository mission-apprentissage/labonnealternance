import Boom from "boom"
import { zRoutes } from "shared/index"

import { ServerBuilder } from "@/http/utils/serverBuilder"

import { Etablissement } from "../../../common/model/index"

/**
 * @description Etablissement server.
 */
export default (server: ServerBuilder) => {
  /**
   * Gets an etablissement from its siret_formateur.
   */
  server.get(
    {
      schema: zRoutes.get["/admin/etablissements/siret-formateur/:siret"],
    },
    async ({ params }, res) => {
      const etablissement = await Etablissement.findOne({ formateur_siret: params.siret })

      if (!etablissement) {
        throw Boom.notFound()
      }

      return res.status(200).send(etablissement)
    }
  )

  /**
   * Gets an etablissement from its id.
   */
  server.get(
    {
      schema: zRoutes.get["/admin/etablissements/:id"],
    },
    async (req, res) => {
      const etablissement = await Etablissement.findById(req.params.id)

      if (!etablissement) {
        throw Boom.notFound()
      }

      return res.send(etablissement)
    }
  )

  /**
   * Updates an etablissement.
   */
  server.patch(
    {
      schema: zRoutes.patch["/admin/etablissements/:id"],
    },
    async ({ body, params }, res) => {
      const etablissement = await Etablissement.findById(params.id)

      if (!etablissement) {
        throw Boom.notFound()
      }

      const result = await Etablissement.findByIdAndUpdate(params.id, body).lean()

      if (!result) {
        throw Boom.notFound()
      }

      res.status(200).send(result)
    }
  )
}
