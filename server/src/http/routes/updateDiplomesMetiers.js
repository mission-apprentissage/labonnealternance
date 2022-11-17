import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { updateDiplomesMetiersQuery } from "../../service/diplomesMetiers.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await updateDiplomesMetiersQuery(req.query)
      return res.json(result)
    })
  )

  return router
}
