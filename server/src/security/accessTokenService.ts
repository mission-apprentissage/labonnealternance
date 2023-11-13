import { FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"
import { PathParam, QueryString, WithQueryStringAndPathParam, generateUri } from "shared/helpers/generateUri"
import { IUserRecruteur } from "shared/models"
import { IRouteSchema, ISecuredRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { Jsonify } from "type-fest"
import { AnyZodObject, z } from "zod"

import config from "@/config"

type SchemaWithSecurity = Pick<IRouteSchema, "method" | "path" | "params" | "querystring"> & WithSecurityScheme

type IScope<Schema extends SchemaWithSecurity> = {
  schema: Schema
  params: Schema["params"] extends AnyZodObject ? Jsonify<z.input<Schema["params"]>> : undefined
  querystring: Schema["querystring"] extends AnyZodObject ? Jsonify<z.input<Schema["querystring"]>> : undefined
  resources: {
    [key in keyof Schema["securityScheme"]["ressources"]]: ReadonlyArray<string>
  }
}

export type IAccessToken<Schema extends SchemaWithSecurity = SchemaWithSecurity> = {
  identity:
    | {
        type: "IUserRecruteur"
        _id: string
        email: string
      }
    | {
        type: "cfa"
        email: string
        siret: string
      }
  scopes: ReadonlyArray<IScope<Schema>>
}

function getAudience(
  scopes: ReadonlyArray<{
    method: string
    path: string
    options: WithQueryStringAndPathParam
  }>
): string[] {
  return scopes.map((scope) => `${scope.method} ${generateUri(scope.path, scope.options)}`.toLowerCase())
}

export function generateAccessToken<Schema extends ISecuredRouteSchema>(
  user: IUserRecruteur | IAccessToken["identity"],
  routes: ReadonlyArray<IScope<Schema>>,
  options: { expiresIn?: string } = {}
): string {
  const audience = getAudience(
    routes.map((route) => ({
      method: route.schema.method,
      path: route.schema.path,
      options: {
        params: route.params,
        querystring: route.querystring,
      },
    }))
  )

  const identity: IAccessToken["identity"] = "_id" in user ? { type: "IUserRecruteur", _id: user._id.toString(), email: user.email.toLowerCase() } : user

  const data: IAccessToken<Schema> = {
    identity,
    scopes: routes,
  }

  return jwt.sign(data, config.auth.user.jwtSecret, {
    audience,
    expiresIn: options.expiresIn ?? config.auth.user.expiresIn,
    issuer: config.publicUrl,
  })
}

export function getAccessTokenScope<Schema extends SchemaWithSecurity>(token: IAccessToken<Schema> | null, schema: Schema): IScope<Schema> | null {
  return token?.scopes.find((s) => s.schema.path === schema.path && s.schema.method === schema.method) ?? null
}

export function parseAccessToken<Schema extends SchemaWithSecurity>(accessToken: null | string, schema: Schema, req: FastifyRequest): IAccessToken<Schema> | null {
  if (!accessToken) {
    return null
  }

  const data = jwt.verify(accessToken, config.auth.user.jwtSecret, {
    complete: true,
    audience: getAudience([
      {
        method: schema.method,
        path: schema.path,
        options: {
          params: req.params as PathParam,
          querystring: req.query as QueryString,
        },
      },
    ]),
    issuer: config.publicUrl,
  })
  const token = data.payload as IAccessToken<Schema>
  return token
}
