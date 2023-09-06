// @ts-nocheck
import jwt from "jsonwebtoken"

import config from "../../config"
import { CFA } from "../../services/constant.service"

const createToken = (type, subject, options = {}) => {
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
const createPasswordToken = (subject, options = {}) => createToken("password", subject, options)
const createUserToken = (user, options = {}) => {
  const payload = { role: user.role }
  return createToken("user", user.email, { payload, ...options })
}

const createUserRecruteurToken = (user, options = {}) => {
  const payload = {
    opco: user.opco,
    scope: user.scope,
    last_name: user.last_name,
    first_name: user.first_name,
    type: user.type,
    establishment_siret: user.establishment_siret,
    establishment_id: user.establishment_id,
    is_delegated: user.type === CFA ? true : false,
    cfa_delegated_siret: user.type === CFA ? user.establishment_siret : undefined,
    id: user._id,
  }

  return createToken("user", user.email, { payload, ...options })
}

const createMagicLinkToken = (subject, options = {}) => createToken("magiclink", subject, options)

export { createActivationToken, createPasswordToken, createUserToken, createUserRecruteurToken, createMagicLinkToken }
