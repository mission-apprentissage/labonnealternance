import { zRoutes } from "shared/index"

import { authenticationMiddleware } from "@/http/middlewares/authMiddleware"
import { administratorOnly } from "@/http/middlewares/permissionsMiddleware"

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
    "/api/admin/etablissements",
    {
      schema: zRoutes.get["/api/admin/etablissement"],
      preHandler: [authenticationMiddleware("jwt-rdv-admin"), administratorOnly],
    },
    async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 50) : 50

      const allData = await Etablissement.paginate({ query, page, limit })

      if (!allData) return res.status(400).send()

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
    "/api/admin/etablissements/siret-formateur/:siret",
    {
      schema: zRoutes.get["/api/admin/etablissements/siret-formateur/:siret"],
      preHandler: [authenticationMiddleware("jwt-rdv-admin"), administratorOnly],
    },
    async ({ params }, res) => {
      const etablissement = await Etablissement.findOne({ formateur_siret: params.siret })

      if (!etablissement) {
        return res.status(404).send()
      }

      return res.status(200).send(etablissement)
    }
  )

  /**
   * Gets an etablissement from its id.
   */
  server.get(
    "/api/admin/etablissements/:id",
    {
      schema: zRoutes.get["/api/admin/etablissements/:id"],
      preHandler: [authenticationMiddleware("jwt-rdv-admin"), administratorOnly],
    },
    async (req, res) => {
      const etablissement = await Etablissement.findById(req.params.id)

      if (!etablissement) {
        return res.status(404).send()
      }

      return res.send(etablissement)
    }
  )

  /**
   * Creates one or multiple etablissements.
   */
  server.post(
    "/api/admin/etablissements/",
    {
      schema: zRoutes.post["api/admin/etablissements/"],
      preHandler: [authenticationMiddleware("jwt-rdv-admin"), administratorOnly],
    },
    async ({ body }, res) => {
      const { etablissements } = body

      let output
      if (etablissements) {
        output = await Promise.all(etablissements.map((etablissement) => etablissements.create(etablissement)))
      } else {
        output = await etablissements.create(body)
      }

      return res.status(200).send(output)
    }
  )

  /**
   * Updates an etablissement.
   */
  server.patch(
    "/api/admin/etablissements/:id",
    {
      schema: zRoutes.post["/api/admin/etablissements/:id"],
      preHandler: [authenticationMiddleware("jwt-rdv-admin"), administratorOnly],
    },
    async ({ body, params }, res) => {
      const etablissement = await Etablissement.findById(params.id)

      if (!etablissement) {
        return res.status(404).send()
      }

      const result = await Etablissement.findByIdAndUpdate(params.id, body)

      res.status(200).send(result)
    }
  )
}
