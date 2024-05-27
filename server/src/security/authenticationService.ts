import { captureException } from "@sentry/node"
import Boom from "boom"
import { FastifyRequest } from "fastify"
import { JwtPayload } from "jsonwebtoken"
import { ICredential, assertUnreachable } from "shared"
import { PathParam, QueryString } from "shared/helpers/generateUri"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { ISecuredRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { Role, UserWithType } from "shared/security/permissions"

import { Credential } from "@/common/model"
import config from "@/config"
import { getSession } from "@/services/sessions.service"
import { updateLastConnectionDate } from "@/services/userRecruteur.service"
import { getUserWithAccountByEmail } from "@/services/userWithAccount.service"

import { controlUserState } from "../services/login.service"

import { IAccessToken, parseAccessToken, verifyJwtToken } from "./accessTokenService"

export type AccessUser2 = UserWithType<"IUser2", IUserWithAccount>
export type AccessUserCredential = UserWithType<"ICredential", ICredential>
export type AccessUserToken = UserWithType<"IAccessToken", IAccessToken>
export type IUserWithType = AccessUser2 | AccessUserCredential | AccessUserToken

declare module "fastify" {
  interface FastifyRequest {
    user?: null | undefined | IUserWithType
    authorizationContext?: null | undefined | { role: Role | null; resources?: any }
  }
}

type AuthenticatedUser<AuthScheme extends WithSecurityScheme["securityScheme"]["auth"]> = AuthScheme extends "cookie-session"
  ? AccessUser2
  : AuthScheme extends "api-key"
    ? AccessUserCredential
    : AuthScheme extends "access-token"
      ? AccessUserToken
      : never

export const getUserFromRequest = <S extends WithSecurityScheme>(req: Pick<FastifyRequest, "user">, _schema: S): AuthenticatedUser<S["securityScheme"]["auth"]> => {
  if (!req.user) {
    throw Boom.internal("User should be authenticated")
  }
  return req.user as AuthenticatedUser<S["securityScheme"]["auth"]>
}

async function authCookieSession(req: FastifyRequest): Promise<AccessUser2 | null> {
  const token = req.cookies?.[config.auth.session.cookieName]

  if (!token) {
    throw Boom.forbidden("Session invalide")
  }

  try {
    const session = await getSession({ token })

    if (!session) {
      return null
    }

    const { email } = verifyJwtToken(token) as JwtPayload

    const user = await getUserWithAccountByEmail(email.toLowerCase())
    if (!user) {
      return null
    }

    const userState = await controlUserState(user)

    if (userState?.error) {
      if (userState.reason !== "VALIDATION") {
        throw Boom.forbidden(`user state invalide : ${userState.reason}`)
      }
    }

    return { type: "IUser2", value: user }
  } catch (error) {
    captureException(error)
    return null
  }
}

async function authApiKey(req: FastifyRequest): Promise<AccessUserCredential | null> {
  const token = req.headers.authorization

  if (token === null) {
    return null
  }

  const user = await Credential.findOne({ api_key: token, actif: true }).lean()

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

async function authAccessToken<S extends ISecuredRouteSchema>(req: FastifyRequest, schema: S): Promise<AccessUserToken | null> {
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
