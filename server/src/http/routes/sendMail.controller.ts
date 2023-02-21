import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { sendTestMail } from "../../service/applications.js"

export default function (components) {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await sendTestMail({ query: req.query, ...components })
      return res.json(result)
    })
  )

  return router
}
