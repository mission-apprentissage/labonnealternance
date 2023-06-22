// @ts-nocheck
import { trackApiCall } from "../../common/utils/sendTrackingEvent.js"
import express from "express"
import { getFormationsParRegionQuery } from "../../services/formation.service.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getFormationsParRegionQuery({ ...req.query, referer: req.headers.referer })

      if (result.error) {
        if (result.error === "wrong_parameters") res.status(400)
        else res.status(500)
      } else {
        const caller = req.query.caller
        if (caller) {
          trackApiCall({
            caller,
            api_path: "formationRegionV1",
            training_count: result.results.length,
            result_count: result.results.length,
            response: "OK",
          })
        }
      }

      return res.json(result)
    })
  )

  return router
}
