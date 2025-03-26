import { FastifyReply, FastifyRequest } from "fastify"
import jwt, { SignOptions } from "jsonwebtoken"

import { createSession, deleteSession } from "@/services/sessions.service"

import config from "../../config"

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
