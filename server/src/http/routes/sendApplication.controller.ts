import mongoose from "mongoose"
import { zRoutes } from "shared/index"

import { Application } from "../../common/model/index"
import { decryptWithIV } from "../../common/utils/encryptString"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { sendNotificationToApplicant, updateApplicationStatus, validateFeedbackApplicationComment } from "../../services/application.service"
import { Server } from "../server"

const config = {
  rateLimit: {
    max: 1,
    timeWindow: "5s",
  },
} as const

export default function (server: Server) {
  server.post(
    "/application/intentionComment",
    {
      schema: zRoutes.post["/application/intentionComment"],
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
          { _id: new mongoose.Types.ObjectId(decryptedId) },
          { company_recruitment_intention: req.body.intention, company_feedback: req.body.comment, company_feedback_date: new Date() }
        )
        if (!application) throw new Error("application not found")

        await sendNotificationToApplicant({
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
    "/application/webhook",
    {
      schema: zRoutes.post["/application/webhook"],
      config,
    },
    async (req, res) => {
      await updateApplicationStatus({ payload: req.body })
      return res.status(200).send({ result: "ok" })
    }
  )
}
