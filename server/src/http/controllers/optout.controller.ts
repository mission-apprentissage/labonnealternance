import { forbidden } from "@hapi/boom"
import { zRoutes } from "shared/index"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getUserFromRequest } from "@/security/authenticationService"

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
        throw forbidden()
      }

      const user = await getDbCollection("optouts").findOne({ siret: userIdentity.siret, "contacts.email": userIdentity.email })

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
