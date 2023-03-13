import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { updateContactInfo } from "../../service/lbb/updateContactInfo.js"

export default function () {
  const router = express.Router()

  router.get(
    "/updateContactInfo",
    tryCatch(async (req, res) => {
      const result = await updateContactInfo(req.query)
      return res.json(result)
    })
  )

  return router
}
