import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { sendApplication } from "../../service/applications.js"

export default function (components) {
  const router = express.Router()

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const result = await sendApplication({
        shouldCheckSecret: req.body.secret ? true : false,
        query: req.body,
        referer: req.headers.referer,
        ...components,
      })

      if (result.error) {
        if (result.error === "error_sending_application") {
          res.status(500)
        } else {
          res.status(400)
        }
      }

      return res.json(result)
    })
  )

  return router
}
