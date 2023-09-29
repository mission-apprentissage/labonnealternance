import Boom from "boom"
import { zRoutes } from "shared/index"

import { Etablissement } from "../../../common/model/index"
import { Server } from "../../server"

/**
 * @description Etablissement server.
 */
export default (server: Server) => {
  /**
   * Gets all etablissements
   * */
  server.get(
    "/admin/etablissements",
    {
      schema: zRoutes.get["/admin/etablissements"],
      preHandler: [server.auth(zRoutes.get["/admin/etablissements"].securityScheme)],
    },
    async (req, res) => {
      const query = req.query.query ? JSON.parse(req.query.query) : {}
      const { page, limit } = req.query

      const allData = await Etablissement.paginate({ query, page, limit })

      if (!allData) {
        throw Boom.notFound()
      }

      return res.status(200).send({
        etablissements: allData.docs,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.totalPages,
          total: allData.totalDocs,
        },
      })
    }
  )

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
   * Creates one or multiple etablissements.
   */
  server.post(
    "/admin/etablissements",
    {
      schema: zRoutes.post["/admin/etablissements"],
      preHandler: [server.auth(zRoutes.post["/admin/etablissements"].securityScheme)],
    },
    async ({ body }, res) => {
      const { etablissements } = body

      let output
      if (etablissements) {
        output = await Promise.all(etablissements.map((etablissement) => Etablissement.create(etablissement)))
      } else {
        output = await Etablissement.create(body)
      }

      return res.status(200).send(output)
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

      const result = await Etablissement.findByIdAndUpdate(params.id, body)

      if (!result) {
        throw Boom.notFound()
      }

      res.status(200).send(result)
    }
  )
}
