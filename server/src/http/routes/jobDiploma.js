import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { getDiplomasForJobsQuery } from "../../service/jobDiploma.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getDiplomasForJobsQuery(req.query)

      if (result === "romes_missing") res.status(400)
      else if (result.error) res.status(500)

      return res.json(result)
    })
  )

  return router
}
