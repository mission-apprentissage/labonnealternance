import { unauthorized, internal } from "@hapi/boom"
import jwt from "jsonwebtoken"

import config from "../../config"

export const createToken = (payload: object, expiresIn: string, subject: string) =>
  jwt.sign(payload, config.auth.user.jwtSecret, {
    issuer: config.publicUrl,
    expiresIn,
    subject,
  })

export const getTokenValue = (token: string) => {
  const { payload }: { payload: string | jwt.JwtPayload } = jwt.verify(token, config.auth.user.jwtSecret, {
    complete: true,
    issuer: config.publicUrl,
  })

  if (payload instanceof Object && "exp" in payload && payload.exp) {
    if (payload.exp < new Date().getTime()) {
      throw unauthorized("Token has expired")
    } else {
      return payload
    }
  } else {
    throw internal("Error reading jwt")
  }
}
