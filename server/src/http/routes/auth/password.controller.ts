import Boom from "boom"
import express from "express"
import Joi from "joi"

import { createUserToken, createPasswordToken } from "../../../common/utils/jwtUtils"
import config from "../../../config"
import * as users from "../../../services/user.service"
import authMiddleware from "../../middlewares/authMiddleware"
import { tryCatch } from "../../middlewares/tryCatchMiddleware"
import * as validators from "../../utils/validators"

export default () => {
  const router = express.Router() // eslint-disable-line new-cap

  router.post(
    "/forgotten-password",
    tryCatch(async (req, res) => {
      const { username } = await Joi.object({
        username: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false })

      if (!(await users.getUser(username))) {
        throw Boom.badRequest()
      }

      const url = `${config.publicUrl}/reset-password?passwordToken=${createPasswordToken(username)}`
      return res.json({ url: url })
    })
  )

  router.post(
    "/reset-password",
    authMiddleware("jwt-password"),
    tryCatch(async (req, res) => {
      const user = req.user
      const { newPassword } = await Joi.object({
        passwordToken: Joi.string().required(),
        newPassword: validators.password().required(),
      }).validateAsync(req.body, { abortEarly: false })

      await users.changePassword(user.username, newPassword)
      return res.json({ token: createUserToken(user) })
    })
  )

  return router
}
