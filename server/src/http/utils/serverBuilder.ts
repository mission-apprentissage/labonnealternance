import Boom from "boom"
import {
  ContextConfigDefault,
  FastifyBaseLogger,
  FastifyReply,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteGenericInterface,
  onRequestHookHandler,
} from "fastify"
import { ResolveFastifyReplyReturnType } from "fastify/types/type-provider"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { IRouteSchemaGet, IRouteSchemaWrite } from "shared/routes/common.routes"

import { AuthenticatedUser, getUserFromRequest } from "../middlewares/authMiddleware"
import { Server } from "../server"

type GetOptions<S extends IRouteSchemaGet> = {
  schema: S
  attachValidation?: boolean
  aliases?: string[]
}

type WriteOptions<S extends IRouteSchemaWrite> = {
  schema: S
  attachValidation?: boolean
  aliases?: string[]
  bodyLimit?: number
}

type Request<S extends IRouteSchemaGet | IRouteSchemaWrite> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  S,
  ZodTypeProvider,
  ContextConfigDefault,
  FastifyBaseLogger
>

type Reply<S extends IRouteSchemaGet | IRouteSchemaWrite> = FastifyReply<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  RouteGenericInterface,
  ContextConfigDefault,
  S,
  ZodTypeProvider
>

type IOnRequestHookHandler<S extends IRouteSchemaGet | IRouteSchemaWrite> = onRequestHookHandler<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  RouteGenericInterface,
  ContextConfigDefault,
  S,
  ZodTypeProvider,
  FastifyBaseLogger
>

type Handler<S extends IRouteSchemaGet | IRouteSchemaWrite> = (
  this: Server,
  req: Request<S>,
  res: Reply<S>,
  user: AuthenticatedUser<S["securityScheme"]["auth"]>
) => ResolveFastifyReplyReturnType<ZodTypeProvider, S, RouteGenericInterface>

export interface IServerBuilder {
  get<S extends IRouteSchemaGet>(options: GetOptions<S>, handler: Handler<S>): this
  post<S extends IRouteSchemaWrite>(options: WriteOptions<S>, handler: Handler<S>): this
}

export class ServerBuilder implements IServerBuilder {
  server: Server

  constructor(server: Server) {
    this.server = server
  }

  getPaths(options: GetOptions<IRouteSchemaGet> | WriteOptions<IRouteSchemaWrite>): string[] {
    const paths: string[] = [options.schema.path]

    if (options.aliases) {
      paths.push(...options.aliases)
    }

    return paths
  }

  getOnRequest<S extends IRouteSchemaGet | IRouteSchemaWrite, O extends S extends IRouteSchemaGet ? GetOptions<S> : S extends IRouteSchemaWrite ? WriteOptions<S> : never>(
    options: O
  ) {
    const onRequest: IOnRequestHookHandler<S>[] = []
    if (["api-key", "jwt-bearer", "cookie-session"].includes(options.schema.securityScheme.auth)) {
      onRequest.push(this.server.auth(options.schema.securityScheme))
    }

    return onRequest
  }

  getPreHandler<S extends IRouteSchemaGet | IRouteSchemaWrite, O extends S extends IRouteSchemaGet ? GetOptions<S> : S extends IRouteSchemaWrite ? WriteOptions<S> : never>(
    options: O
  ): IOnRequestHookHandler<S>[] {
    const preHandler: IOnRequestHookHandler<S>[] = []
    if (options.schema.securityScheme.auth !== "none") {
      preHandler.push(this.server.auth(options.schema.securityScheme))
    }

    return preHandler
  }

  get<S extends IRouteSchemaGet>(options: GetOptions<S>, handler: Handler<S>): this {
    if (options.schema.method !== "get") {
      throw Boom.internal(`Invalid method for ${options.schema.path}`)
    }

    for (const path of this.getPaths(options)) {
      this.server.get(
        path,
        {
          schema: options.schema,
          config: {
            rateLimit: options.schema.rateLimit,
          },
          onRequest: this.getOnRequest(options),
          preHandler: this.getPreHandler(options),
        },
        (req, res) => {
          return handler.bind(this.server)(req, res, getUserFromRequest(req, options.schema))
        }
      )
    }

    return this
  }

  post<S extends IRouteSchemaWrite>(options: WriteOptions<S>, handler: Handler<S>): this {
    if (options.schema.method !== "post") {
      throw Boom.internal(`Invalid method for ${options.schema.path}`)
    }

    for (const path of this.getPaths(options)) {
      this.server.post(
        path,
        {
          schema: options.schema,
          config: {
            rateLimit: options.schema.rateLimit,
          },
          onRequest: this.getOnRequest(options),
          preHandler: this.getPreHandler(options),
          bodyLimit: options.bodyLimit,
        },
        (req, res) => {
          return handler.bind(this.server)(req, res, getUserFromRequest(req, options.schema))
        }
      )
    }

    return this
  }

  patch<S extends IRouteSchemaWrite>(options: WriteOptions<S>, handler: Handler<S>): this {
    if (options.schema.method !== "patch") {
      throw Boom.internal(`Invalid method for ${options.schema.path}`)
    }

    for (const path of this.getPaths(options)) {
      this.server.patch(
        path,
        {
          schema: options.schema,
          config: {
            rateLimit: options.schema.rateLimit,
          },
          onRequest: this.getOnRequest(options),
          preHandler: this.getPreHandler(options),
          bodyLimit: options.bodyLimit,
        },
        (req, res) => {
          return handler.bind(this.server)(req, res, getUserFromRequest(req, options.schema))
        }
      )
    }

    return this
  }

  put<S extends IRouteSchemaWrite>(options: WriteOptions<S>, handler: Handler<S>): this {
    if (options.schema.method !== "put") {
      throw Boom.internal(`Invalid method for ${options.schema.path}`)
    }

    for (const path of this.getPaths(options)) {
      this.server.put(
        path,
        {
          schema: options.schema,
          config: {
            rateLimit: options.schema.rateLimit,
          },
          onRequest: this.getOnRequest(options),
          preHandler: this.getPreHandler(options),
          bodyLimit: options.bodyLimit,
        },
        (req, res) => {
          return handler.bind(this.server)(req, res, getUserFromRequest(req, options.schema))
        }
      )
    }

    return this
  }

  delete<S extends IRouteSchemaWrite>(options: WriteOptions<S>, handler: Handler<S>): this {
    if (options.schema.method !== "put") {
      throw Boom.internal(`Invalid method for ${options.schema.path}`)
    }

    for (const path of this.getPaths(options)) {
      this.server.put(
        path,
        {
          schema: options.schema,
          config: {
            rateLimit: options.schema.rateLimit,
          },
          onRequest: this.getOnRequest(options),
          preHandler: this.getPreHandler(options),
          bodyLimit: options.bodyLimit,
        },
        (req, res) => {
          return handler.bind(this.server)(req, res, getUserFromRequest(req, options.schema))
        }
      )
    }

    return this
  }
}
