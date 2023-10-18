import { FastifyReply } from "fastify"
import jwt from "jsonwebtoken"

import { createSession } from "@/services/sessions.service"

import config from "../../config"

const createSessionToken = (email: string) => {
  return jwt.sign({ email }, config.auth.user.jwtSecret, {
    issuer: config.publicUrl,
    expiresIn: config.auth.user.expiresIn,
    subject: email,
  })
}

async function startSession(email: string, res: FastifyReply) {
  const token = createSessionToken(email)
  await createSession({ token })
  res.setCookie(config.auth.session.cookieName, token, config.auth.session.cookie)
}

export { startSession }
