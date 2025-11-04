import { forbidden, internal, unauthorized } from "@hapi/boom"
import { captureException } from "@sentry/node"
import { parseApiAlternanceToken  } from "api-alternance-sdk"
import type {IApiAlternanceTokenData} from "api-alternance-sdk";
import type { FastifyRequest } from "fastify"
import type { JwtPayload } from "jsonwebtoken"
import type { ComputedUserAccess, ICredential} from "shared";
import { assertUnreachable } from "shared"
import type { PathParam, QueryString } from "shared/helpers/generateUri"
import type { IUserWithAccount } from "shared/models/userWithAccount.model"
import type { ISecuredRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import type { Role, UserWithType } from "shared/security/permissions"

import type { IAccessToken} from "./accessTokenService";
import { parseAccessToken, verifyJwtToken } from "./accessTokenService"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { getSession } from "@/services/sessions.service"
import { updateLastConnectionDate } from "@/services/userRecruteur.service"
import { getUserWithAccountByEmail } from "@/services/userWithAccount.service"

import { controlUserState } from "@/services/login.service"


export type AccessUser2 = UserWithType<"IUser2", IUserWithAccount>
export type AccessUserCredential = UserWithType<"ICredential", ICredential>
export type AccessUserToken = UserWithType<"IAccessToken", IAccessToken>
export type AccessApiApprentissage = UserWithType<"IApiApprentissage", IApiAlternanceTokenData>

export type IUserWithType = AccessUser2 | AccessUserCredential | AccessUserToken | AccessApiApprentissage

declare module "fastify" {
  interface FastifyRequest {
    userAccess?: ComputedUserAccess
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
      : AuthScheme extends "api-apprentissage"
        ? AccessApiApprentissage
        : never

export const getUserFromRequest = <S extends WithSecurityScheme>(req: Pick<FastifyRequest, "user">, _schema: S): AuthenticatedUser<S["securityScheme"]["auth"]> => {
  if (!req.user) {
    throw internal("User should be authenticated")
  }
  return req.user as AuthenticatedUser<S["securityScheme"]["auth"]>
}

async function authCookieSession(req: FastifyRequest): Promise<AccessUser2 | null> {
  const token = req.cookies?.[config.auth.session.cookieName]

  if (!token) {
    throw forbidden("Session invalide")
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
      if (userState.data !== "VALIDATION") {
        throw forbidden(`user state invalide : ${userState.data}`)
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

  const user = await getDbCollection("credentials").findOne({ api_key: token, actif: true })

  return user ? { type: "ICredential", value: user } : null
}

async function authApiApprentissage(req: FastifyRequest): Promise<AccessApiApprentissage | null> {
  const result = await parseApiAlternanceToken({
    token: req.headers.authorization ?? "",
    publicKey: config.auth.apiApprentissage.publicKey,
  })

  if (result.success) return { type: "IApiApprentissage", value: result.data }

  throw unauthorized(`Unable to parse token ${result.reason}`)
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
    throw internal("Missing securityScheme")
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
    case "api-apprentissage":
      req.user = await authApiApprentissage(req)
      break
    default:
      assertUnreachable(securityScheme.auth)
  }

  if (!req.user) {
    throw unauthorized()
  }
}
