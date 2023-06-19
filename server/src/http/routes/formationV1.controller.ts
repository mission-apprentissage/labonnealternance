// @ts-nocheck
import { trackApiCall } from "../../common/utils/sendTrackingEvent.js"
import express from "express"
import { getFormationDescriptionQuery, getFormationQuery, getFormationsQuery } from "../../services/formation.service.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

/**
 * API romes
 */
export default () => {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getFormationsQuery({ ...req.query, referer: req.headers.referer })

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }
      } else {
        const caller = req?.query?.caller
        if (caller) {
          trackApiCall({
            caller: caller,
            api_path: "formationV1",
            training_count: result.results.formations?.length,
            result_count: result.results.formations?.length,
            response: "OK",
          })
        }
      }

      return res.json(result)
    })
  )

  router.get(
    "/formation/:id",
    tryCatch(async (req, res) => {
      const caller = req?.query?.caller
      const result = await getFormationQuery({
        id: req.params.id,
        referer: req.headers.referer,
        caller,
      })

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(result.status || 500)
        }
      } else {
        if (caller) {
          trackApiCall({
            caller,
            api_path: "formationV1/formation",
            training_count: 1,
            result_count: 1,
            response: "OK",
          })
        }
      }

      return res.json(result)
    })
  )

  router.get(
    "/formationDescription/:id",
    tryCatch(async (req, res) => {
      const result = await getFormationDescriptionQuery({
        id: req.params.id,
        referer: req.headers.referer,
      })

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(500)
        }
      }

      return res.json(result)
    })
  )

  return router
}
