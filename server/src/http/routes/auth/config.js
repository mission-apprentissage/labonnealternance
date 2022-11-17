import express from "express"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"
import config from "../../../config.js"

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
