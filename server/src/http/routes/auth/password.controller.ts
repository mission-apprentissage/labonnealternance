import express from "express"
import Boom from "boom"
import Joi from "joi"
import config from "../../../config.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"
import { createUserToken } from "../../../common/utils/jwtUtils.js"
import * as validators from "../../utils/validators.js"
import { createPasswordToken } from "../../../common/utils/jwtUtils.js"
import * as users from "../../../services/user.service.js"
import authMiddleware from "../../middlewares/authMiddleware.js"

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
