import { ObjectId } from "mongodb"
import { oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { zRoutes } from "shared/index"

import { getDbCollection } from "../../common/utils/mongodbUtils"
import { getApplicationDataForIntentionAndScheduleMessage, getCompanyEmailFromToken, sendApplication, sendRecruiterIntention } from "../../services/application.service"
import { Server } from "../server"

const rateLimitConfig = {
  rateLimit: {
    max: 1,
    timeWindow: "5s",
  },
} as const

export default function (server: Server) {
  server.post(
    "/v1/application",
    {
      schema: zRoutes.post["/v1/application"],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "5s",
        },
      },
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      const { company_type } = req.body

      const result = await sendApplication({
        newApplication: { ...req.body, company_type: oldItemTypeToNewItemType(company_type) },
        referer: req.headers.referer as string,
      })

      if ("error" in result) {
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
    "/application/intentionComment/:id",
    {
      schema: zRoutes.post["/application/intentionComment/:id"],
      onRequest: server.auth(zRoutes.post["/application/intentionComment/:id"]),
      config: rateLimitConfig,
    },
    async (req, res) => {
      const { id } = req.params
      const { company_recruitment_intention, company_feedback, email, phone, refusal_reasons } = req.body

      await sendRecruiterIntention({
        application_id: new ObjectId(id),
        company_recruitment_intention,
        company_feedback,
        email,
        phone,
        refusal_reasons,
      })

      return res.status(200).send({ result: "ok", message: "comment registered" })
    }
  )

  server.post(
    "/application/intention/cancel/:id",
    {
      schema: zRoutes.post["/application/intention/cancel/:id"],
      onRequest: server.auth(zRoutes.post["/application/intention/cancel/:id"]),
      config: rateLimitConfig,
    },
    async (req, res) => {
      const { id } = req.params

      await getDbCollection("recruiter_intention_mails").deleteOne({ applicationId: new ObjectId(id) })

      return res.status(200).send({ result: "ok", message: "intention canceled" })
    }
  )

  server.post(
    "/application/intention/:id",
    {
      schema: zRoutes.post["/application/intention/:id"],
      onRequest: server.auth(zRoutes.post["/application/intention/:id"]),
      config: rateLimitConfig,
    },
    async (req, res) => {
      const { id } = req.params
      const { company_recruitment_intention } = req.body

      const application = await getDbCollection("applications").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { company_recruitment_intention, company_feedback_date: new Date() } }
      )
      if (!application) throw new Error("application not found")

      return res.status(200).send({ result: "ok" })
    }
  )

  server.get(
    "/application/company/email",
    {
      schema: zRoutes.get["/application/company/email"],
    },
    async (req, res) => {
      const { token } = req.query
      const company_email = await getCompanyEmailFromToken(token)
      return res.status(200).send({ company_email })
    }
  )

  server.get(
    "/application/intention/schedule/:id",
    {
      schema: zRoutes.get["/application/intention/schedule/:id"],
      onRequest: server.auth(zRoutes.get["/application/intention/schedule/:id"]),
    },
    async (req, res) => {
      const { id } = req.params
      const { intention } = req.query
      const data = await getApplicationDataForIntentionAndScheduleMessage(id, intention)
      return res.status(200).send({ ...data })
    }
  )
}
