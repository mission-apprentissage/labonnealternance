import Boom from "boom"
import mongoose from "mongoose"
import { zRoutes } from "shared/index"

import config from "@/config"

import { Application } from "../../common/model/index"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { sendMailToApplicant } from "../../services/application.service"
import { Server } from "../server"

const rateLimitConfig = {
  rateLimit: {
    max: 1,
    timeWindow: "5s",
  },
} as const

export default function (server: Server) {
  server.post(
    "/application/intentionComment/:id",
    {
      schema: zRoutes.post["/application/intentionComment/:id"],
      // KBA 2023-12-14 : Activate in production 1st of february
      onRequest: config.env !== "production" ? server.auth(zRoutes.post["/application/intentionComment/:id"]) : async () => {},
      config: rateLimitConfig,
    },
    async (req, res) => {
      const { id } = req.params
      const { company_recruitment_intention, company_feedback, email, phone } = req.body

      try {
        const application = await Application.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(id) },
          { company_recruitment_intention, company_feedback, company_feedback_date: new Date() }
        )
        if (!application) throw new Error("application not found")

        await sendMailToApplicant({
          application,
          email,
          phone,
          company_recruitment_intention,
          company_feedback,
        })

        return res.status(200).send({ result: "ok", message: "comment registered" })
      } catch (err) {
        sentryCaptureException(err)
        throw Boom.badRequest("error_saving_comment")
      }
    }
  )

  server.post(
    "/application/intention/:id",
    {
      schema: zRoutes.post["/application/intention/:id"],
      // KBA 2023-12-14 : Activate in production 1st of february
      onRequest: config.env !== "production" ? server.auth(zRoutes.post["/application/intention/:id"]) : async () => {},
      config: rateLimitConfig,
    },
    async (req, res) => {
      const { id } = req.params
      const { company_recruitment_intention } = req.body

      const application = await Application.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id) }, { company_recruitment_intention, company_feedback_date: new Date() })
      if (!application) throw new Error("application not found")

      return res.status(200).send({ result: "ok" })
    }
  )
}
