import { notFound } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { zRoutes } from "shared/index"

import { getDbCollection } from "@/common/utils/mongodbUtils"

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
      onRequest: [server.auth(zRoutes.get["/admin/etablissements/siret-formateur/:siret"])],
    },
    async ({ params }, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ formateur_siret: params.siret })

      if (!etablissement) {
        throw notFound()
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
      onRequest: [server.auth(zRoutes.get["/admin/etablissements/:id"])],
    },
    async (req, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(req.params.id) })

      if (!etablissement) {
        throw notFound()
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
      onRequest: [server.auth(zRoutes.patch["/admin/etablissements/:id"])],
    },
    async ({ body, params }, res) => {
      const etablissement = await getDbCollection("etablissements").findOne({ _id: new ObjectId(params.id.toString()) })

      if (!etablissement) {
        throw notFound()
      }

      const result = await getDbCollection("etablissements").findOneAndUpdate({ _id: new ObjectId(params.id.toString()) }, { $set: body }, { returnDocument: "after" })

      if (!result) {
        throw notFound()
      }

      res.status(200).send(result)
    }
  )
}
