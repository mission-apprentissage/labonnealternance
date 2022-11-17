import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { updateLaBonneBoite } from "../../service/lbb/updateLaBonneBoite.js"
import { updateGeoLocations } from "../../service/lbb/updateGeoLocations.js"
import { updateOpcos } from "../../service/lbb/updateOpcos.js"
import { updateContactInfo } from "../../service/lbb/updateContactInfo.js"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await updateLaBonneBoite(req.query)
      return res.json(result)
    })
  )

  router.get(
    "/updateGeoLocations",
    tryCatch(async (req, res) => {
      const result = await updateGeoLocations(req.query)
      return res.json(result)
    })
  )

  router.get(
    "/updateOpcos",
    tryCatch(async (req, res) => {
      const result = await updateOpcos(req.query)
      return res.json(result)
    })
  )

  router.get(
    "/updateContactInfo",
    tryCatch(async (req, res) => {
      const result = await updateContactInfo(req.query)
      return res.json(result)
    })
  )

  return router
}
