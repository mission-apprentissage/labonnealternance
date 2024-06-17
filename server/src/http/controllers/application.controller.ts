import Boom from "boom"
import { ObjectId } from "mongodb"
import { oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { zRoutes } from "shared/index"

import { getDbCollection } from "../../common/utils/mongodbUtils"
import { sendApplication, sendMailToApplicant } from "../../services/application.service"
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
      const { company_recruitment_intention, company_feedback, email, phone } = req.body

      const application = await getDbCollection("applications").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { company_recruitment_intention, company_feedback, company_feedback_date: new Date() } }
      )

      if (!application) {
        throw Boom.notFound()
      }

      await sendMailToApplicant({
        application,
        email,
        phone,
        company_recruitment_intention,
        company_feedback,
      })

      return res.status(200).send({ result: "ok", message: "comment registered" })
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
}
