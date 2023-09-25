import Boom from "boom"
import Joi from "joi"
import { zRoutes } from "shared/index"

import { createUserToken, createPasswordToken } from "../../../common/utils/jwtUtils"
import config from "../../../config"
import * as users from "../../../services/user.service"
import { Server } from "../../server"
import * as validators from "../../utils/validators"

export default (server: Server) => {
  server.post(
    "/api/password/forgotten-password",
    {
      schema: zRoutes.post["/api/password/forgotten-password"],
    },
    async (req, res) => {
      const { username } = await Joi.object({
        username: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false })

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
      // preHandler: [authenticationMiddleware("jwt-password")],
    },
    async (req, res) => {
      const user = req.user
      const { newPassword } = await Joi.object({
        passwordToken: Joi.string().required(),
        newPassword: validators.password().required(),
      }).validateAsync(req.body, { abortEarly: false })

      await users.changePassword(user.username, newPassword)
      return res.status(200).send({ token: createUserToken(user) })
    }
  )
}
