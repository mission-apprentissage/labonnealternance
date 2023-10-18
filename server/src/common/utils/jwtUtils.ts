import jwt, { SignOptions } from "jsonwebtoken"

import config from "../../config"

type CreateTokenOptions = {
  secret?: string
  expiresIn?: SignOptions["expiresIn"]
  payload?: string | Buffer | object
}

const createToken = (type: "user" | "activation" | "password" | "magiclink", subject: SignOptions["subject"], options: CreateTokenOptions = {}) => {
  const defaults = config.auth[type]
  const secret = options.secret || defaults.jwtSecret
  const expiresIn = options.expiresIn || defaults.expiresIn
  const payload = options.payload || {}

  return jwt.sign(payload, secret, {
    issuer: config.appName,
    expiresIn: expiresIn,
    subject: subject,
  })
}

const createActivationToken = (subject, options = {}) => createToken("activation", subject, options)
const createUserToken = (user, options = {}) => {
  const payload = { role: user.role }
  return createToken("user", user.email, { payload, ...options })
}

export { createActivationToken, createUserToken }
