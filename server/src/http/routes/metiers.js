import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { getMetiers, getMetiersPourCfd, getMetiersPourEtablissement, getTousLesMetiers, getCoupleAppellationRomeIntitule } from "../../service/domainesMetiers.js"

export default function () {
  const router = express.Router()

  router.get(
    "/metiersParFormation/:cfd",
    tryCatch(async (req, res) => {
      const result = await getMetiersPourCfd({ cfd: req.params.cfd })

      if (result.error) {
        res.status(500)
      }

      return res.json(result)
    })
  )

  router.get(
    "/metiersParEtablissement/:siret",
    tryCatch(async (req, res) => {
      const result = await getMetiersPourEtablissement({ siret: req.params.siret })

      if (result.error) {
        res.status(500)
      }

      return res.json(result)
    })
  )

  router.get(
    "/all",
    tryCatch(async (req, res) => {
      const result = await getTousLesMetiers()

      if (result.error) {
        res.status(500)
      }

      return res.json(result)
    })
  )

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getMetiers({ title: req.query.title, romes: req.query.romes, rncps: req.query.rncps })

      if (result.error) {
        if (result.error === "missing_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }
      }

      return res.json(result)
    })
  )

  router.get(
    "/intitule",
    tryCatch(async (req, res) => {
      const result = await getCoupleAppellationRomeIntitule(req.query.label)

      if (result.error) {
        if (result.error === "missing_parameters") {
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
