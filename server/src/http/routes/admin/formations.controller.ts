import express from "express"

import { getCatalogueFormations } from "../../../services/catalogue.service"
import { tryCatch } from "../../middlewares/tryCatchMiddleware"

/**
 * @description Formations router.
 */
export default () => {
  const router = express.Router()

  /**
   * @description Get in formation collection.
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}

      const response = await getCatalogueFormations(query)

      return res.send(response)
    })
  )
  return router
}
