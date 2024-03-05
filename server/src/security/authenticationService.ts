import { captureException } from "@sentry/node"
import Boom from "boom"
import { FastifyRequest } from "fastify"
import jwt, { JwtPayload } from "jsonwebtoken"
import { ICredential, assertUnreachable } from "shared"
import { PathParam, QueryString } from "shared/helpers/generateUri"
import { IUser2 } from "shared/models/user2.model"
import { ISecuredRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { UserWithType } from "shared/security/permissions"

import { Credential } from "@/common/model"
import config from "@/config"
import { getSession } from "@/services/sessions.service"
import { getUser2ByEmail } from "@/services/user2.service"
import { updateLastConnectionDate } from "@/services/userRecruteur.service"

import { controlUserState } from "../services/login.service"

import { IAccessToken, parseAccessToken } from "./accessTokenService"

export type IUserWithType = UserWithType<"IUser2", IUser2> | UserWithType<"ICredential", ICredential> | UserWithType<"IAccessToken", IAccessToken>

declare module "fastify" {
  interface FastifyRequest {
    user?: null | undefined | IUserWithType
  }
}

type AuthenticatedUser<AuthScheme extends WithSecurityScheme["securityScheme"]["auth"]> = AuthScheme extends "cookie-session"
  ? UserWithType<"IUser2", IUser2>
  : AuthScheme extends "api-key"
    ? UserWithType<"ICredential", ICredential>
    : AuthScheme extends "access-token"
      ? UserWithType<"IAccessToken", IAccessToken>
      : never

export const getUserFromRequest = <S extends WithSecurityScheme>(req: Pick<FastifyRequest, "user">, _schema: S): AuthenticatedUser<S["securityScheme"]["auth"]> => {
  if (!req.user) {
    throw Boom.internal("User should be authenticated")
  }
  return req.user as AuthenticatedUser<S["securityScheme"]["auth"]>
}

async function authCookieSession(req: FastifyRequest): Promise<UserWithType<"IUser2", IUser2> | null> {
  const token = req.cookies?.[config.auth.session.cookieName]

  if (!token) {
    throw Boom.forbidden("Session invalide")
  }

  try {
    const session = await getSession({ token })

    if (!session) {
      return null
    }

    const { email } = jwt.verify(token, config.auth.user.jwtSecret) as JwtPayload

    const user = await getUser2ByEmail(email.toLowerCase())
    if (!user) {
      return null
    }

    const userState = await controlUserState(user)

    if (userState?.error) {
      if (userState.reason !== "VALIDATION") {
        throw Boom.forbidden()
      }
    }

    return { type: "IUser2", value: user }
  } catch (error) {
    captureException(error)
    return null
  }
}

async function authApiKey(req: FastifyRequest): Promise<UserWithType<"ICredential", ICredential> | null> {
  const token = req.headers.authorization

  if (token === null) {
    return null
  }

  const user = await Credential.findOne({ api_key: token }).lean()

  return user ? { type: "ICredential", value: user } : null
}

const bearerRegex = /^bearer\s+(\S+)$/i
function extractBearerTokenFromHeader(req: FastifyRequest): null | string {
  const { authorization } = req.headers

  if (!authorization) {
    return null
  }

  const matches = authorization.match(bearerRegex)

  return matches === null ? null : matches[1]
}

async function authAccessToken<S extends ISecuredRouteSchema>(req: FastifyRequest, schema: S): Promise<UserWithType<"IAccessToken", IAccessToken> | null> {
  const token = extractBearerTokenFromHeader(req)
  if (token === null) {
    return null
  }
  const parsedToken = await parseAccessToken(token, schema, req.params as PathParam, req.query as QueryString)
  await updateLastConnectionDate(parsedToken.identity.email)
  return { type: "IAccessToken", value: parsedToken }
}

export async function authenticationMiddleware<S extends ISecuredRouteSchema>(schema: S, req: FastifyRequest) {
  if (!schema.securityScheme) {
    throw Boom.internal("Missing securityScheme")
  }

  const securityScheme = schema.securityScheme

  switch (securityScheme.auth) {
    case "cookie-session":
      req.user = await authCookieSession(req)
      break
    case "api-key":
      req.user = await authApiKey(req)
      break
    case "access-token":
      req.user = await authAccessToken(req, schema)
      break
    default:
      assertUnreachable(securityScheme.auth)
  }

  if (!req.user) {
    throw Boom.unauthorized()
  }
}
