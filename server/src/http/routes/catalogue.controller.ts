import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

import { getUniqueArray } from "../../common/utils/array.js"
import { getFormations } from "../../services/catalogue.service.js"

/**
 * @description Catalogue router.
 */
export default () => {
  const router = express.Router()

  /**
   * @description Proxify catalogue's requests.
   */
  router.get(
    "/formations",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}

      const response = await getFormations(query)

      return res.send(response)
    })
  )

  return router
}
