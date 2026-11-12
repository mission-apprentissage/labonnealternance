import { badRequest, notFound } from "@hapi/boom"
import { zRoutes } from "shared"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "shared/constants/index"

import type { Server } from "@/http/server"
import { unsubscribeNoSiret, unsubscribeWithSirets } from "@/services/unsubscribe-recruteur-lba.service"

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
      const { reason, reason_detail } = req.body

      const result = await unsubscribeNoSiret({ email, reason, reasonDetail: reason_detail })
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
      const { reason, reason_detail, sirets } = req.body
      if (!sirets.length) {
        throw badRequest(UNSUBSCRIBE_EMAIL_ERRORS.SIRETS_EMPTY)
      }
      const result = await unsubscribeWithSirets({ email, reason, reasonDetail: reason_detail, sirets })
      if (result.modifiedCount === 0) {
        throw notFound(UNSUBSCRIBE_EMAIL_ERRORS.UNKNOWN_COMPANY)
      }
      return res.status(200).send(result)
    }
  )
}
