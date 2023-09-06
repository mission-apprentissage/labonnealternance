import express from "express"

import config from "../../../config"
import { tryCatch } from "../../middlewares/tryCatchMiddleware"

export default () => {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      return res.json({
        config: config,
      })
    })
  )

  return router
}
