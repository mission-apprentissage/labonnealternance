import { badRequest, notFound } from "@hapi/boom"
import { zRoutes } from "shared"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "shared/constants/index"

import { unsubscribeNoSiret, unsubscribeWithSirets } from "@/services/unsubscribeRecruteurLba.service"

import { Server } from "../server"

export default function (server: Server) {
  server.post(
    "/unsubscribe",
    {
      schema: zRoutes.post["/unsubscribe"],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "5s",
        },
      },
    },
    async (req, res) => {
      const email = req.body.email.toLowerCase()
      const reason = req.body.reason

      const result = await unsubscribeNoSiret({ email, reason })
      if ("modifiedCount" in result && result.modifiedCount === 0) {
        throw notFound(UNSUBSCRIBE_EMAIL_ERRORS.UNKNOWN_COMPANY)
      }
      return res.status(200).send(result)
    }
  )
  server.post(
    "/unsubscribe/sirets",
    {
      schema: zRoutes.post["/unsubscribe/sirets"],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "5s",
        },
      },
    },
    async (req, res) => {
      const email = req.body.email.toLowerCase()
      const reason = req.body.reason
      const sirets = req.body.sirets
      if (!sirets.length) {
        throw badRequest(UNSUBSCRIBE_EMAIL_ERRORS.SIRETS_EMPTY)
      }
      const result = await unsubscribeWithSirets({ email, reason, sirets })
      if (result.modifiedCount === 0) {
        throw notFound(UNSUBSCRIBE_EMAIL_ERRORS.UNKNOWN_COMPANY)
      }
      return res.status(200).send(result)
    }
  )
}
