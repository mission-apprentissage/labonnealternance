import Boom from "boom"
import {
  ContextConfigDefault,
  FastifyBaseLogger,
  FastifyRequest,
  FastifySchema,
  FastifyTypeProvider,
  FastifyTypeProviderDefault,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
  RawServerDefault,
  RouteGenericInterface,
  preHandlerHookHandler,
} from "fastify"
import jwt, { JwtPayload } from "jsonwebtoken"
import passport from "passport"
import { ICredential } from "shared"
import { IUserRecruteur } from "shared/models/usersRecruteur.model"
import { AuthStrategy, IRouteSchema, SecurityScheme } from "shared/routes/common.routes"

import { Credential } from "@/common/model"
import { IUser } from "@/common/model/schema/user/user.types"
import config from "@/config"
import { getSession } from "@/services/sessions.service"
import { getUser } from "@/services/user.service"
import { getUser as getUserRecruteur } from "@/services/userRecruteur.service"

export default (strategyName: AuthStrategy) => passport.authenticate(strategyName, { session: false })

declare module "fastify" {
  interface FastifyRequest {
    user?: null | IUserRecruteur | IUser | undefined | ICredential
  }
}

type AuthenticatedUser<AuthScheme extends IRouteSchema["securityScheme"]["auth"]> = AuthScheme extends "jwt-password"
  ? IUser
  : AuthScheme extends "jwt-bearer" | "jwt-token" | "cookie-session"
  ? IUserRecruteur
  : AuthScheme extends "api-key"
  ? ICredential
  : null

export const getUserFromRequest = <S extends IRouteSchema>(req: FastifyRequest, _schema: S): AuthenticatedUser<S["securityScheme"]["auth"]> => {
  return req.user as AuthenticatedUser<S["securityScheme"]["auth"]>
}

function extractFieldFrom(source: unknown, field: string): null | string {
  if (source === null || typeof source !== "object") {
    return null
  }

  return field in source && typeof source[field] === "string" ? source[field] : null
}

const authJwtPassword = createAuthHandler(async (req: FastifyRequest): Promise<IUser | null> => {
  const passwordToken = extractFieldFrom(req.body, "passwordToken")

  if (passwordToken === null) {
    return null
  }

  const payload = jwt.verify(passwordToken, config.auth.password.jwtSecret) as JwtPayload

  return payload.sub ? getUser(payload.sub) : null
})

const authJwtToken = createAuthHandler(async (req: FastifyRequest): Promise<IUserRecruteur | null> => {
  const token = extractFieldFrom(req.body, "token")

  if (token === null) {
    return null
  }

  const payload = jwt.verify(token, config.auth.magiclink.jwtSecret) as JwtPayload

  return payload.sub ? getUserRecruteur({ email: payload.sub }) : null
})

const authCookieSession = createAuthHandler(async (req: FastifyRequest): Promise<IUserRecruteur | null> => {
  const token = req.cookies?.[config.auth.session.cookieName]

  if (!token) {
    throw Boom.forbidden("Session invalide")
  }

  try {
    const session = await getSession({ token })

    if (!session) {
      throw Boom.forbidden("Session invalide")
    }

    const { email } = jwt.verify(token, config.auth.user.jwtSecret) as JwtPayload

    const user = await getUserRecruteur({ email })

    if (!user) {
      throw Boom.forbidden("Session invalide")
    }

    return user
  } catch (error) {
    throw Boom.forbidden("Session invalide")
  }
})

const authApiKey = createAuthHandler(async (req: FastifyRequest): Promise<ICredential | null> => {
  const token = req.headers.authorization

  if (token === null) {
    return null
  }

  const user = await Credential.findOne({ api_key: token }).lean()

  return user ?? null
})

const authorizationnAdmin = async (req: FastifyRequest) => {
  if (!req.user) {
    throw Boom.unauthorized()
  }
  // @ts-expect-error: TODO
  if (req.user.type !== "ADMIN") {
    throw Boom.unauthorized()
  }
}

// We need this to be able to compare in test and check what's the proper auth
function createAuthHandler(authFn: (req: FastifyRequest) => Promise<FastifyRequest["user"]>) {
  return async (req: FastifyRequest) => {
    req.user = await authFn(req)

    if (!req.user) {
      throw Boom.unauthorized()
    }
  }
}

function authenticationMiddleware(strategy: SecurityScheme, req: FastifyRequest) {
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

function authorizationnMiddleware(strategy: SecurityScheme, req: FastifyRequest) {
  switch (strategy.role) {
    case "administrator":
      return authorizationnAdmin(req)
    case "all":
      return async () => {
        // noop
      }
    default:
      // Temp solution to not break server
      return async () => {}
    // throw Boom.internal("Unknown authMiddleware strategy", { strategy })
  }
}

const symbol = Symbol("authStrategy")

export function auth(strategy: SecurityScheme) {
  const authMiddleware = async (req: FastifyRequest) => {
    await authenticationMiddleware(strategy, req)
    await authorizationnMiddleware(strategy, req)
  }

  authMiddleware[symbol] = strategy

  return authMiddleware
}

export function describeAuthMiddleware(fn: any): SecurityScheme | null {
  return fn[symbol] ?? null
}

declare module "fastify" {
  interface FastifyInstance<
    RawServer extends RawServerBase = RawServerDefault,
    RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
    RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
    Logger extends FastifyBaseLogger = FastifyBaseLogger,
    TypeProvider extends FastifyTypeProvider = FastifyTypeProviderDefault,
  > {
    auth<RouteGeneric extends RouteGenericInterface = RouteGenericInterface, ContextConfig = ContextConfigDefault, SchemaCompiler extends FastifySchema = FastifySchema>(
      strategy: SecurityScheme
    ): preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler, TypeProvider, Logger>
  }
}
