import Boom from "boom"
import { zRoutes } from "shared/index"

import { getUserFromRequest } from "@/security/authenticationService"

import { Optout } from "../../common/model/index"
import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/optout/validate",
    {
      schema: zRoutes.get["/optout/validate"],
      onRequest: [server.auth(zRoutes.get["/optout/validate"])],
    },
    async (req, res) => {
      const userIdentity = getUserFromRequest(req, zRoutes.get["/optout/validate"]).value.identity
      if (userIdentity.type !== "cfa") {
        throw Boom.forbidden()
      }

      const user = await Optout.findOne({ siret: userIdentity.siret, "contacts.email": userIdentity.email }).lean()

      if (!user) {
        return res.status(400).send({ error: true, reason: "USER_NOT_FOUND" })
      }
      return res.status(200).send({
        ...user,
        // Set recipient email for the UI
        email: userIdentity.email,
      })
    }
  )
}
