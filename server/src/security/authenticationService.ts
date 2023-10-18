import { captureException } from "@sentry/node"
import Boom from "boom"
import { FastifyRequest } from "fastify"
import jwt, { JwtPayload } from "jsonwebtoken"
import { ICredential } from "shared"
import { IUserRecruteur } from "shared/models/usersRecruteur.model"
import { ISecuredRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { UserWithType } from "shared/security/permissions"

import { Credential } from "@/common/model"
import config from "@/config"
import { getSession } from "@/services/sessions.service"
import { getUser as getUserRecruteur } from "@/services/userRecruteur.service"

import { IAccessToken, parseAccessToken } from "./accessTokenService"

export type IUserWithType = UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential> | UserWithType<"IAccessToken", IAccessToken>

declare module "fastify" {
  interface FastifyRequest {
    user?: null | undefined | IUserWithType
  }
}

type AuthenticatedUser<AuthScheme extends WithSecurityScheme["securityScheme"]["auth"]> = AuthScheme extends "jwt-token" | "cookie-session" | "jwt-password"
  ? UserWithType<"IUserRecruteur", IUserRecruteur>
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

function extractFieldFrom(source: unknown, field: string): null | string {
  if (source === null || typeof source !== "object") {
    return null
  }

  return field in source && typeof source[field] === "string" ? source[field] : null
}

async function authJwtPassword(req: FastifyRequest): Promise<UserWithType<"IUserRecruteur", IUserRecruteur> | null> {
  const passwordToken = extractFieldFrom(req.body, "passwordToken")

  if (passwordToken === null) {
    return null
  }

  const payload = jwt.verify(passwordToken, config.auth.password.jwtSecret) as JwtPayload

  const user = payload.sub ? await getUserRecruteur({ email: payload.sub }) : null
  return user ? { type: "IUserRecruteur", value: user } : null
}

async function authJwtToken(req: FastifyRequest): Promise<UserWithType<"IUserRecruteur", IUserRecruteur> | null> {
  const token = extractFieldFrom(req.query, "token")

  if (token === null) {
    return null
  }

  const payload = jwt.verify(token, config.auth.magiclink.jwtSecret) as JwtPayload

  const user = payload.sub ? await getUserRecruteur({ email: payload.sub.toLowerCase() }) : null
  return user ? { type: "IUserRecruteur", value: user } : null
}

async function authCookieSession(req: FastifyRequest): Promise<UserWithType<"IUserRecruteur", IUserRecruteur> | null> {
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

    const user = await getUserRecruteur({ email })

    return user ? { type: "IUserRecruteur", value: user } : null
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
  const token = parseAccessToken(extractBearerTokenFromHeader(req), schema)

  if (token === null) {
    return null
  }

  return token ? { type: "IAccessToken", value: token } : null
}

function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here")
}

export async function authenticationMiddleware<S extends ISecuredRouteSchema>(schema: S, req: FastifyRequest) {
  if (!schema.securityScheme) {
    throw Boom.internal("Missing securityScheme")
  }

  const securityScheme = schema.securityScheme

  switch (securityScheme.auth) {
    case "jwt-password":
      req.user = await authJwtPassword(req)
      break
    case "jwt-token":
      req.user = await authJwtToken(req)
      break
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
