import { zRoutes } from "shared/index"

import { getSourceFromCookies } from "@/common/utils/httpUtils"

import { getUserFromRequest } from "../../../security/authenticationService"
import { sendApplicationV2 } from "../../../services/application.service"
import { Server } from "../../server"

export default function (server: Server) {
  server.post(
    "/v2/application",
    {
      schema: zRoutes.post["/v2/application"],
      onRequest: server.auth(zRoutes.post["/v2/application"]),
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "5s",
        },
      },
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/v2/application"]).value
      const result = await sendApplicationV2({ newApplication: req.body, caller: user.organisation! })
      return res.status(202).send({ id: result._id.toString() })
    }
  )
  server.post(
    "/v2/_private/application",
    {
      schema: zRoutes.post["/v2/_private/application"],
      onRequest: server.auth(zRoutes.post["/v2/_private/application"]),
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "5s",
        },
      },
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      await sendApplicationV2({
        newApplication: req.body,
        caller: req.body.caller || undefined,
        source: getSourceFromCookies(req),
      })
      return res.status(200).send({})
    }
  )
}
