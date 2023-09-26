import jwt from "jsonwebtoken"
import { zRoutes } from "shared/index"

import { Optout } from "../../common/model/index"
import config from "../../config"
import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/api/optout/validate",
    {
      schema: zRoutes.get["/api/optout/validate"],
      preHandler: [server.auth(zRoutes.get["/api/optout/validate"].securityScheme)],
    },
    async (req, res) => {
      const token = req.headers && req.headers.authorization && req.headers.authorization.split(" ")[1]

      if (!token) {
        return res.status(401).send({ error: true, reason: "TOKEN_NOT_FOUND" })
      }

      const { siret, email }: any = jwt.verify(token, config.auth["activation"].jwtSecret)

      const user = await Optout.findOne({ siret, "contacts.email": email }).lean()

      if (!user) {
        return res.status(400).send({ error: true, reason: "USER_NOT_FOUND" })
      }
      // @ts-expect-error: TODO
      return res.status(200).send({
        ...user,
        // Set recipient email for the UI
        email,
      })
    }
  )
}
