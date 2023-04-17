// @ts-nocheck
import express from "express"
import { getMatchaJobById } from "../../service/matcha.js"
import { getCompanyQuery, getJobsQuery, getPeJobQuery } from "../../service/poleEmploi/jobsAndCompanies.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getJobsQuery({ ...req.query, referer: req.headers.referer })

      if (result.error) {
        if (result.error === "wrong_parameters") res.status(400)
        else res.status(500)
      }

      return res.json(result)
    })
  )

  router.get(
    "/job/:id",
    tryCatch(async (req, res) => {
      const result = await getPeJobQuery({
        id: req.params.id,
        referer: req.headers.referer,
        caller: req.query.caller,
      })

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(result.status || 500)
        }
      }

      return res.json(result)
    })
  )

  router.get(
    "/matcha/:id",
    tryCatch(async (req, res) => {
      const result = await getMatchaJobById({
        id: req.params.id,
        caller: req.query.caller,
      })

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(result.status || 500)
        }
      }

      return res.json(result)
    })
  )

  router.get(
    "/company/:siret",
    tryCatch(async (req, res) => {
      const result = await getCompanyQuery({
        siret: req.params.siret,
        type: req.query.type,
        referer: req.headers.referer,
        caller: req.query.caller,
      })

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else if (result.error === "not_found") {
          res.status(404)
        } else {
          res.status(result.status || 500)
        }
      }

      return res.json(result)
    })
  )

  return router
}
