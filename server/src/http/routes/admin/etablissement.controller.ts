import express from "express"
import { mailTemplate } from "../../../assets/index.js"
import { mailType, optMode } from "../../../common/model/constants/etablissement.js"
import { referrers } from "../../../common/model/constants/referrers.js"
import { Etablissement } from "../../../common/model/index.js"
import { dayjs } from "../../../common/utils/dayjs.js"
import config from "../../../config.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

/**
 * @description Etablissement Router.
 */
export default ({ etablissements, mailer }) => {
  const router = express.Router()

  /**
   * Gets all etablissements
   * */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 50) : 50

      const allData = await Etablissement.paginate({ query, page, limit })

      return res.send({
        etablissements: allData.docs,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.totalPages,
          total: allData.totalDocs,
        },
      })
    })
  )

  /**
   * Gets an etablissement from its siret_formateur.
   */
  router.get(
    "/siret-formateur/:siret",
    tryCatch(async ({ params }, res) => {
      const etablissement = await etablissements.findOne({ formateur_siret: params.siret })

      if (!etablissement) {
        return res.sendStatus(404)
      }

      return res.send(etablissement)
    })
  )

  /**
   * Gets an etablissement from its id.
   */
  router.get(
    "/:id",
    tryCatch(async (req, res) => {
      const etablissement = await etablissements.findById(req.params.id)

      if (!etablissement) {
        return res.sendStatus(404)
      }

      return res.send(etablissement)
    })
  )

  /**
   * Creates one or multiple etablissements.
   */
  router.post(
    "/",
    tryCatch(async ({ body }, res) => {
      const { etablissements } = body

      let output
      if (etablissements) {
        output = await Promise.all(etablissements.map((etablissement) => etablissements.create(etablissement)))
      } else {
        output = await etablissements.create(body)
      }

      return res.send(output)
    })
  )

  /**
   * Updates an etablissement.
   */
  router.patch(
    "/:id",
    tryCatch(async ({ body, params }, res) => {
      const etablissement = await etablissements.findById(params.id)

      if (!etablissement) {
        return res.sendStatus(404)
      }

      const result = await etablissements.findByIdAndUpdate(params.id, body)

      res.send(result)
    })
  )

  /**
   * Deletes an etablissement.
   */
  router.delete(
    "/:id",
    tryCatch(async ({ params }, res) => {
      await etablissements.findByIdAndDelete(params.id)

      return res.sendStatus(204)
    })
  )

  return router
}
