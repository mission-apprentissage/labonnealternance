import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { updateFormationsQuery } from "../../service/updateFormations.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await updateFormationsQuery(req.query)
      return res.json(result)
    })
  )

  return router
}
