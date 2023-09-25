// @ts-nocheck
import express from "express"
import rateLimit from "express-rate-limit"
import { ObjectId } from "mongodb"

import { Application } from "../../common/model/index"
import { decryptWithIV } from "../../common/utils/encryptString"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { sendApplication, sendNotificationToApplicant, updateApplicationStatus, validateFeedbackApplicationComment } from "../../services/application.service"
import { tryCatch } from "../middlewares/tryCatchMiddleware"

const limiter1Per5Second = rateLimit({
  windowMs: 5000, // 5 seconds
  max: 1, // limit each IP to 1 request per windowMs
})

export default function (components) {
  const router = express.Router()

  router.post(
    "/",
    limiter1Per5Second,
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

  router.post(
    "/intentionComment",
    limiter1Per5Second,
    tryCatch(async (req, res) => {
      // email and phone should appear
      await validateFeedbackApplicationComment({
        id: req.body.id,
        iv: req.body.iv,
        comment: req.body.comment,
      })

      const decryptedId = decryptWithIV(req.body.id, req.body.iv)

      try {
        const application = await Application.findOneAndUpdate(
          { _id: ObjectId(decryptedId) },
          { company_recruitment_intention: req.body.intention, company_feedback: req.body.comment, company_feedback_date: new Date() }
        )

        await sendNotificationToApplicant({
          application,
          intention: req.body.intention,
          email: req.body.email,
          phone: req.body.phone,
          comment: req.body.comment,
        })

        return res.json({ result: "ok", message: "comment registered" })
      } catch (err) {
        console.error("err ", err)
        sentryCaptureException(err)
        return res.json({ error: "error_saving_comment" })
      }
    })
  )

  router.post(
    "/webhook",
    tryCatch(async (req, res) => {
      await updateApplicationStatus({ payload: req.body })

      return res.json({ result: "ok" })
    })
  )

  return router
}
