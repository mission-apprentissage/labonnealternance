import { captureException } from "@sentry/node"
import Boom from "boom"
import { FastifyRequest } from "fastify"
import jwt, { JwtPayload } from "jsonwebtoken"
import { ICredential } from "shared"
import { IUserRecruteur } from "shared/models/usersRecruteur.model"
import { SecurityScheme, WithSecurityScheme } from "shared/routes/common.routes"
import { UserWithType } from "shared/security/permissions"

import { Credential } from "@/common/model"
import config from "@/config"
import { getSession } from "@/services/sessions.service"
import { getUser as getUserRecruteur } from "@/services/userRecruteur.service"

declare module "fastify" {
  interface FastifyRequest {
    user?: null | undefined | UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>
  }
}

type AuthenticatedUser<AuthScheme extends WithSecurityScheme["securityScheme"]["auth"]> = AuthScheme extends "jwt-token" | "cookie-session" | "jwt-password"
  ? UserWithType<"IUserRecruteur", IUserRecruteur>
  : AuthScheme extends "api-key"
  ? UserWithType<"ICredential", ICredential>
  : never

export const getUserFromRequest = <S extends WithSecurityScheme>(req: FastifyRequest, _schema: S): AuthenticatedUser<S["securityScheme"]["auth"]> => {
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

const authJwtPassword = createAuthHandler(async (req: FastifyRequest): Promise<UserWithType<"IUserRecruteur", IUserRecruteur> | null> => {
  const passwordToken = extractFieldFrom(req.body, "passwordToken")

  if (passwordToken === null) {
    return null
  }

  const payload = jwt.verify(passwordToken, config.auth.password.jwtSecret) as JwtPayload

  const user = payload.sub ? await getUserRecruteur({ email: payload.sub }) : null
  return user ? { type: "IUserRecruteur", value: user } : null
})

const authJwtToken = createAuthHandler(async (req: FastifyRequest): Promise<UserWithType<"IUserRecruteur", IUserRecruteur> | null> => {
  const token = extractFieldFrom(req.query, "token")

  if (token === null) {
    return null
  }

  const payload = jwt.verify(token, config.auth.magiclink.jwtSecret) as JwtPayload

  const user = payload.sub ? await getUserRecruteur({ email: payload.sub.toLowerCase() }) : null
  return user ? { type: "IUserRecruteur", value: user } : null
})

const authCookieSession = createAuthHandler(async (req: FastifyRequest): Promise<UserWithType<"IUserRecruteur", IUserRecruteur> | null> => {
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
})

const authApiKey = createAuthHandler(async (req: FastifyRequest): Promise<UserWithType<"ICredential", ICredential> | null> => {
  const token = req.headers.authorization

  if (token === null) {
    return null
  }

  const user = await Credential.findOne({ api_key: token }).lean()

  return user ? { type: "ICredential", value: user } : null
})

// We need this to be able to compare in test and check what's the proper auth
function createAuthHandler(authFn: (req: FastifyRequest) => Promise<FastifyRequest["user"]>) {
  return async (req: FastifyRequest) => {
    req.user = await authFn(req)

    if (!req.user) {
      throw Boom.unauthorized()
    }
  }
}

export function authenticationMiddleware(strategy: SecurityScheme, req: FastifyRequest) {
  switch (strategy.auth) {
    case "jwt-password":
      return authJwtPassword(req)
    case "jwt-token":
      return authJwtToken(req)
    case "cookie-session":
      return authCookieSession(req)
    case "api-key":
      return authApiKey(req)
    case "none":
      return async () => {
        // noop
      }
    default:
      // Temp solution to not break server
      return async () => {}
    // throw Boom.internal("Unknown authMiddleware strategy", { strategy })
  }
}
