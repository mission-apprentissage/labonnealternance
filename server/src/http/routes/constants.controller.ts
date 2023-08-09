import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { referrers } from "../../db/constants/referrers.js"
import { optMode } from "../../db/constants/etablissement.js"

/**
 * @description Constants router.
 */
export default () => {
  const router = express.Router()

  /**
   * @description Returns all constants.
   */
  router.get(
    "/",
    tryCatch((req, res) => res.send({ referrers: Object.values(referrers), optMode: Object.values(optMode) }))
  )

  return router
}
