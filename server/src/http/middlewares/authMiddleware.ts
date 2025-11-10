import type {
  ContextConfigDefault,
  FastifyBaseLogger,
  FastifyRequest,
  FastifyTypeProvider,
  FastifyTypeProviderDefault,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
  RawServerDefault,
  RouteGenericInterface,
  preHandlerHookHandler,
} from "fastify"
import type { IRouteSchema, SecurityScheme, WithSecurityScheme } from "shared/routes/common.routes"

import { createAccessLog } from "@/security/accessLog.service"
import { authenticationMiddleware } from "@/security/authenticationService"
import { authorizationMiddleware } from "@/security/authorisationService"

const symbol = Symbol("authStrategy")

export function auth<S extends IRouteSchema & WithSecurityScheme>(schema: S) {
  const authMiddleware = async (req: FastifyRequest) => {
    try {
      await authenticationMiddleware(schema, req)
      await authorizationMiddleware(schema, req)
      await createAccessLog(schema, req, true)
    } catch (error: any) {
      if (error?.isBoom && (error?.output?.payload.statusCode === 401 || error?.output?.payload.statusCode === 403)) {
        await createAccessLog(schema, req, false)
      }
      throw error
    }
  }

  authMiddleware[symbol] = schema.securityScheme

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
      scheme: IRouteSchema & WithSecurityScheme
    ): preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler, TypeProvider, Logger>
  }
}
