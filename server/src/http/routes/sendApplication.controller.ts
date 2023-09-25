import { ObjectId } from "mongodb"
import { zRoutes } from "shared/index"

import { Application } from "../../common/model/index"
import { decryptWithIV } from "../../common/utils/encryptString"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { sendApplication, sendNotificationToApplicant, updateApplicationStatus, validateFeedbackApplicationComment } from "../../services/application.service"
import { Server } from "../server"

const config = {
  rateLimit: {
    max: 1,
    timeWindow: "5s",
  },
} as const

export default function (server: Server) {
  server.post(
    "/api/application",
    {
      schema: zRoutes.post["/api/application"],
      config,
    },
    async (req, res) => {
      const result = await sendApplication({
        shouldCheckSecret: req.body.secret ? true : false,
        query: req.body,
        referer: req.headers.referer,
      })

      if (result.error) {
        if (result.error === "error_sending_application") {
          res.status(500)
        } else {
          res.status(400)
        }
      } else {
        res.status(200)
      }

      return res.send(result)
    }
  )

  server.post(
    "/api/application/intentionComment",
    {
      schema: zRoutes.post["/api/application/intentionComment"],
      config,
    },
    async (req, res) => {
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

        sendNotificationToApplicant({
          application,
          intention: req.body.intention,
          email: req.body.email,
          phone: req.body.phone,
          comment: req.body.comment,
        })

        return res.status(200).send({ result: "ok", message: "comment registered" })
      } catch (err) {
        console.error("err ", err)
        sentryCaptureException(err)
        // TODO: return 500
        return res.status(200).send({ error: "error_saving_comment" })
      }
    }
  )

  server.post(
    "/api/application/webhook",
    {
      schema: zRoutes.post["/api/application/webhook"],
      config,
    },
    async (req, res) => {
      updateApplicationStatus({ payload: req.body })
      return res.status(200).send({ result: "ok" })
    }
  )
}
