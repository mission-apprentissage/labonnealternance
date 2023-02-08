import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { getJobsEtFormationsQuery } from "../../service/jobsEtFormations.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getJobsEtFormationsQuery({ ...req.query, referer: req.headers.referer })

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }
      }

      return res.json(result)
    })
  )

  return router
}
