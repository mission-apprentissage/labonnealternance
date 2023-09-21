// @ts-nocheck
import express from "express"

import { getRomesAndLabelsFromTitleQuery } from "../../../services/metiers.service"
import { tryCatch } from "../../middlewares/tryCatchMiddleware"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.json(result)
    })
  )

  return router
}
