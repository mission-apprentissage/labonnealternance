import { ObjectId } from "mongodb"
import { ApplicationIntention } from "shared/constants/application"
import { oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { assertUnreachable, CompanyFeebackSendStatus, zRoutes } from "shared/index"

import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import {
  buildApplicationFromHelloworkAndSaveToDb,
  getApplicationDataForIntentionAndScheduleMessage,
  getCompanyEmailFromToken,
  sendApplication,
  sendRecruiterIntention,
} from "@/services/application.service"
import type { Server } from "@/http/server"
import config from "@/config"

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
      const { company_recruitment_intention } = req.body
      const application_id = new ObjectId(id)

      switch (company_recruitment_intention) {
        case ApplicationIntention.ENTRETIEN: {
          const { company_recruitment_intention, company_feedback, email, phone } = req.body
          await sendRecruiterIntention({
            application_id,
            company_recruitment_intention,
            company_feedback,
            email,
            phone,
            refusal_reasons: [],
          })
          break
        }
        case ApplicationIntention.REFUS: {
          const { company_recruitment_intention, company_feedback, refusal_reasons } = req.body
          await sendRecruiterIntention({
            application_id,
            company_recruitment_intention,
            company_feedback,
            refusal_reasons,
            email: "",
            phone: "",
          })
          break
        }
        default: {
          assertUnreachable(company_recruitment_intention)
        }
      }

      return res.status(200).send({})
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

      await getDbCollection("applications").updateOne({ _id: new ObjectId(id) }, { $set: { company_feedback_send_status: CompanyFeebackSendStatus.CANCELED } })

      return res.status(200).send({})
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
      return res.status(200).send(data)
    }
  )

  server.post(
    "/application/hellowork",
    {
      schema: zRoutes.post["/application/hellowork"],
    },
    async (_req, res) => {
      if (_req.headers["x-api-key"] !== config.helloworkApiKey) {
        return res.status(401).send({
          message: "Problème d'authentification",
          code: "Authentication",
        })
      }
      try {
        const result = await buildApplicationFromHelloworkAndSaveToDb(_req.body)
        return res.status(200).send(result)
      } catch (err: any) {
        switch (err.message) {
          case BusinessErrorCodes.BURNER:
          case BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_OFFER:
          case BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_DAY:
          case BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_SIRET:
            return res.status(400).send({
              message: err.message,
              code: "RejectedCandidate",
            })
          case BusinessErrorCodes.NOTFOUND:
          case BusinessErrorCodes.EXPIRED:
            return res.status(400).send({
              message: err.message,
              code: "Offer",
            })
          case BusinessErrorCodes.FILE_TYPE_NOT_SUPPORTED:
            return res.status(400).send({
              message: err.message,
              code: "Attachment",
            })
          default:
            return res.status(500).send({
              message: "Erreur interne du serveur",
              code: "InternalServerError",
            })
        }
      }
    }
  )
}
