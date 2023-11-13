import Boom from "boom"
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
  options:
    | "all"
    | {
        params: Schema["params"] extends AnyZodObject ? Jsonify<z.input<Schema["params"]>> : undefined
        querystring: Schema["querystring"] extends AnyZodObject ? Jsonify<z.input<Schema["querystring"]>> : undefined
      }
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

function getAudience(scope: { method: string; path: string; options: WithQueryStringAndPathParam }): string {
  return `${scope.method} ${generateUri(scope.path, scope.options)}`.toLowerCase()
}

export function generateAccessToken<Schema extends ISecuredRouteSchema>(
  user: IUserRecruteur | IAccessToken["identity"],
  scopes: ReadonlyArray<IScope<Schema>>,
  options: { expiresIn?: string } = {}
): string {
  const audiences = scopesToAudiences(scopes)
  const identity: IAccessToken["identity"] = "_id" in user ? { type: "IUserRecruteur", _id: user._id.toString(), email: user.email.toLowerCase() } : user
  const data: IAccessToken<Schema> = {
    identity,
    scopes,
  }

  return jwt.sign(data, config.auth.user.jwtSecret, {
    audience: audiences,
    expiresIn: options.expiresIn ?? config.auth.user.expiresIn,
    issuer: config.publicUrl,
  })
}

export function getAccessTokenScope<Schema extends SchemaWithSecurity>(token: IAccessToken<Schema> | null, schema: Schema): IScope<Schema> | null {
  return token?.scopes.find((s) => s.schema.path === schema.path && s.schema.method === schema.method) ?? null
}

export function parseAccessToken<Schema extends SchemaWithSecurity>(
  accessToken: null | string,
  schema: Schema,
  params: PathParam | undefined,
  querystring: QueryString | undefined
): IAccessToken<Schema> | null {
  if (!accessToken) {
    return null
  }
  const data = jwt.verify(accessToken, config.auth.user.jwtSecret, {
    complete: true,
    issuer: config.publicUrl,
  })
  const token = data.payload as IAccessToken<Schema>
  const specificAudience = getAudience({
    method: schema.method,
    path: schema.path,
    options: {
      params,
      querystring,
    },
  })
  const genericAudience = getAudience({
    method: schema.method,
    path: schema.path,
    options: {},
  })
  const tokenAudiences: string[] = scopesToAudiences(token.scopes)
  const isAuthorized = tokenAudiences.includes(specificAudience) || tokenAudiences.includes(genericAudience)
  if (!isAuthorized) {
    throw Boom.forbidden("Les audiences ne correspondent pas")
  }
  return token
}

function scopesToAudiences<Schema extends SchemaWithSecurity>(scopes: ReadonlyArray<IScope<Schema>>) {
  return scopes.map((scope) =>
    getAudience({
      method: scope.schema.method,
      path: scope.schema.path,
      options:
        scope.options === "all"
          ? {}
          : {
              params: scope.options.params,
              querystring: scope.options.querystring,
            },
    })
  )
}
