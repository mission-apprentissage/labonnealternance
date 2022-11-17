import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { getFormationsParRegionQuery } from "../../service/formations.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getFormationsParRegionQuery({ ...req.query, referer: req.headers.referer })

      if (result.error) {
        if (result.error === "wrong_parameters") res.status(400)
        else res.status(500)
      }

      return res.json(result)
    })
  )

  return router
}
