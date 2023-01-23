import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { getMetiersDAvenir } from "../../service/diagoriente/metiersDAvenir.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getMetiersDAvenir()

      if (result.error) {
        res.status(500)
      }

      return res.json(result)
    })
  )

  return router
}
