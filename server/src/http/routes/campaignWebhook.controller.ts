import express from "express"

import { addEmailToBlacklist, removeEmailFromLbaCompanies } from "../../services/application.service"
import { BrevoEventStatus } from "../../services/brevo.service"
import { tryCatch } from "../middlewares/tryCatchMiddleware"

export default function () {
  const router = express.Router()

  router.post(
    "/",
    tryCatch(async (req, res) => {
      /* Format payload
      {
        req.body.event : "hard_bounce",
        req.body.email:"john.doe@mail.com",
        ...
      }*/
      if (req.body.event === BrevoEventStatus.HARD_BOUNCE) {
        await Promise.all([addEmailToBlacklist(req.body.email, "campaign"), removeEmailFromLbaCompanies(req.body.email)])
      }

      return res.json({ result: "ok" })
    })
  )

  return router
}
