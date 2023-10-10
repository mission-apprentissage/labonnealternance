import Boom from "boom"
import { zRoutes } from "shared/index"

import { Etablissement } from "../../../common/model/index"
import { Server } from "../../server"

/**
 * @description Etablissement server.
 */
export default (server: Server) => {
  /**
   * Gets an etablissement from its siret_formateur.
   */
  server.get(
    "/admin/etablissements/siret-formateur/:siret",
    {
      schema: zRoutes.get["/admin/etablissements/siret-formateur/:siret"],
      preHandler: [server.auth(zRoutes.get["/admin/etablissements/siret-formateur/:siret"].securityScheme)],
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
    "/admin/etablissements/:id",
    {
      schema: zRoutes.get["/admin/etablissements/:id"],
      preHandler: [server.auth(zRoutes.get["/admin/etablissements/:id"].securityScheme)],
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
    "/admin/etablissements/:id",
    {
      schema: zRoutes.patch["/admin/etablissements/:id"],
      preHandler: [server.auth(zRoutes.patch["/admin/etablissements/:id"].securityScheme)],
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
