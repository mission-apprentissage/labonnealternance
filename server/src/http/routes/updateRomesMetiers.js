import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { updateRomesMetiersQuery, getMissingRNCPs } from "../../service/domainesMetiers.js"
import path from "path"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await updateRomesMetiersQuery(req.query)
      return res.json(result)
    })
  )

  router.get(
    "/missingRNCPs",
    tryCatch(async (req, res) => {
      const result = await getMissingRNCPs(req.query)
      return res.json(result)
    })
  )

  router.get("/missingRNCPs/RNCP_manquants.xlsx", (req, res) => {
    res.sendFile(path.resolve("./src/jobs/domainesMetiers/assets/RNCPs_manquants.xlsx"))
  })

  return router
}
