import express from "express"

import { Etablissement } from "../../../common/model/index"
import { tryCatch } from "../../middlewares/tryCatchMiddleware"

/**
 * @description Etablissement Router.
 */
export default () => {
  const router = express.Router()

  /**
   * Gets an etablissement from its siret_formateur.
   */
  router.get(
    "/siret-formateur/:siret",
    tryCatch(async ({ params }, res) => {
      const etablissement = await Etablissement.findOne({ formateur_siret: params.siret })

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
      const etablissement = await Etablissement.findById(req.params.id)

      if (!etablissement) {
        return res.sendStatus(404)
      }

      return res.send(etablissement)
    })
  )

  /**
   * Updates an etablissement.
   */
  router.patch(
    "/:id",
    tryCatch(async ({ body, params }, res) => {
      const etablissement = await Etablissement.findById(params.id)

      if (!etablissement) {
        return res.sendStatus(404)
      }

      const result = await Etablissement.findByIdAndUpdate(params.id, body)

      res.send(result)
    })
  )

  return router
}
