import Boom from "boom"
import { zRoutes } from "shared/index"

import { createUserToken, createPasswordToken } from "../../../common/utils/jwtUtils"
import config from "../../../config"
import * as users from "../../../services/user.service"
import { Server } from "../../server"

export default (server: Server) => {
  server.post(
    "/api/password/forgotten-password",
    {
      schema: zRoutes.post["/api/password/forgotten-password"],
    },
    async (req, res) => {
      const { username } = req.body
      if (!(await users.getUser(username))) {
        throw Boom.badRequest()
      }

      const url = `${config.publicUrl}/reset-password?passwordToken=${createPasswordToken(username)}`
      return res.status(200).send({ url: url })
    }
  )

  server.post(
    "/api/password/reset-password",
    {
      schema: zRoutes.post["/api/password/reset-password"],
      preHandler: [server.auth(zRoutes.post["/api/password/reset-password"].securityScheme)],
    },
    async (req, res) => {
      const user = req.user

      if (!user || !("username" in user)) {
        throw Boom.forbidden()
      }

      const { newPassword } = req.body

      await users.changePassword(user.username, newPassword)
      return res.status(200).send({ token: createUserToken(user) })
    }
  )
}
