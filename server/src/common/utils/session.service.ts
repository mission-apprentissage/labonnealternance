import type { FastifyReply, FastifyRequest } from "fastify"
import type { SignOptions } from "jsonwebtoken"
import jwt from "jsonwebtoken"

import config from "@/config"
import { createSession, deleteSession } from "@/services/sessions.service"

export const createSessionToken = (email: string) => {
  return jwt.sign({ email }, config.auth.user.jwtSecret, {
    issuer: config.publicUrl,
    expiresIn: config.auth.user.expiresIn,
    subject: email,
  } as SignOptions)
}

async function startSession(email: string, res: FastifyReply) {
  const token = createSessionToken(email)
  await createSession({ token })
  res.setCookie(config.auth.session.cookieName, token, config.auth.session.cookie)
  return token
}

async function stopSession(req: FastifyRequest, res: FastifyReply) {
  const token = req.cookies[config.auth.session.cookieName]

  if (token) {
    await deleteSession(token)
  }

  res.clearCookie(config.auth.session.cookieName, config.auth.session.cookie)
}

export { startSession, stopSession }
