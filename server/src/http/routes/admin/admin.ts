import express from "express"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

export default () => {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      return res.json({
        message: "Authentified admin route",
      })
    })
  )

  return router
}
