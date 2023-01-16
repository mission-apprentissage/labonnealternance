import express from "express"
import { updateHardBounceEmails } from "../../service/applications.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

export default function (components) {
  const router = express.Router()

  router.post(
    "/",
    tryCatch(async (req, res) => {
      updateHardBounceEmails({ payload: req.body, ...components })
      return res.json({ result: "ok" })
    })
  )

  return router
}
