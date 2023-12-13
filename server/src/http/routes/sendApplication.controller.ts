import Boom from "boom"
import mongoose from "mongoose"
import { zRoutes } from "shared/index"

import config from "@/config"

import { Application } from "../../common/model/index"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { sendMailToApplicant, updateApplicationStatus } from "../../services/application.service"
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
      onRequest: (req, res, done) => {
        if (config.env !== "production") {
          // KBA 2023-12-13 : Active for production on 1st of February
          server.auth(zRoutes.post["/application/intentionComment/:id"])
        }
        done()
      },
      config: rateLimitConfig,
    },
    async (req, res) => {
      const { id } = req.params
      const { company_recruitment_intention, company_feedback } = req.body

      try {
        const application = await Application.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(id) },
          { company_recruitment_intention, company_feedback, company_feedback_date: new Date() }
        )
        if (!application) throw new Error("application not found")

        await sendMailToApplicant({
          application,
          intention: company_recruitment_intention,
          email: req.body.email,
          phone: req.body.phone,
          comment: company_feedback,
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
      onRequest: (req, res, done) => {
        if (config.env !== "production") {
          // KBA 2023-12-13 : Active for production on 1st of February
          server.auth(zRoutes.post["/application/intention/:id"])
        }
        done()
      },
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

  server.post(
    "/application/webhook",
    {
      schema: zRoutes.post["/application/webhook"],
    },
    async (req, res) => {
      const { apikey } = req.query
      if (apikey !== config.smtp.brevoWebhookApiKey) {
        throw Boom.unauthorized()
      }

      await updateApplicationStatus({ payload: req.body })
      return res.status(200).send({ result: "ok" })
    }
  )
}
