import Boom from "boom"
import jwt from "jsonwebtoken"
import { PathParam, QueryString, WithQueryStringAndPathParam, generateUri } from "shared/helpers/generateUri"
import { IUserRecruteur } from "shared/models"
import { IRouteSchema, ISecuredRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { assertUnreachable } from "shared/utils"
import { Jsonify } from "type-fest"
import { AnyZodObject, z } from "zod"

import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

// cf https://www.sistrix.com/ask-sistrix/technical-seo/site-structure/url-length-how-long-can-a-url-be
const INTERNET_EXPLORER_V10_MAX_LENGTH = 2083
const OUTLOOK_URL_MAX_LENGTH = 8192
const NGINX_URL_MAX_LENGTH = 4096
const URL_MAX_LENGTH = Math.min(INTERNET_EXPLORER_V10_MAX_LENGTH, OUTLOOK_URL_MAX_LENGTH, NGINX_URL_MAX_LENGTH)
const TOKEN_MAX_LENGTH = URL_MAX_LENGTH - "https://labonnealternance.apprentissage.beta.gouv.fr/".length

type SchemaWithSecurity = Pick<IRouteSchema, "method" | "path" | "params" | "querystring"> & WithSecurityScheme

// TODO à retirer à partir du 01/02/2024
type OldIScope<Schema extends SchemaWithSecurity> = {
  schema: Schema
  options:
    | "all"
    | {
        params: Schema["params"] extends AnyZodObject ? Jsonify<z.input<Schema["params"]>> : undefined
        querystring: Schema["querystring"] extends AnyZodObject ? Jsonify<z.input<Schema["querystring"]>> : undefined
      }
  resources: {
    [key in keyof Schema["securityScheme"]["resources"]]: ReadonlyArray<string>
  }
}

type NewIScope<Schema extends SchemaWithSecurity> = {
  method: Schema["method"]
  path: Schema["path"]
  options:
    | "all"
    | {
        params: Schema["params"] extends AnyZodObject ? Jsonify<z.input<Schema["params"]>> : undefined
        querystring: Schema["querystring"] extends AnyZodObject ? Jsonify<z.input<Schema["querystring"]>> : undefined
      }
  resources: {
    [key in keyof Schema["securityScheme"]["resources"]]: ReadonlyArray<string>
  }
}

type IScope<Schema extends SchemaWithSecurity> = NewIScope<Schema> | OldIScope<Schema>

export const generateScope = <Schema extends SchemaWithSecurity>(scope: Omit<NewIScope<Schema>, "method" | "path"> & { schema: Schema }): NewIScope<Schema> => {
  const { schema, options, resources } = scope
  return { options, resources, path: schema.path, method: schema.method }
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

function getAudience({
  method,
  path,
  options,
  skipParamsReplacement,
}: {
  method: string
  path: string
  options: WithQueryStringAndPathParam
  skipParamsReplacement: boolean
}): string {
  return `${method} ${generateUri(path, options, skipParamsReplacement)}`.toLowerCase()
}

export function generateAccessToken(
  user: IUserRecruteur | IAccessToken["identity"],
  scopes: ReadonlyArray<NewIScope<ISecuredRouteSchema>>,
  options: { expiresIn?: string } = {}
): string {
  const identity: IAccessToken["identity"] = "_id" in user ? { type: "IUserRecruteur", _id: user._id.toString(), email: user.email.toLowerCase() } : user
  const data: IAccessToken<ISecuredRouteSchema> = {
    identity,
    scopes,
  }

  const token = jwt.sign(data, config.auth.user.jwtSecret, {
    expiresIn: options.expiresIn ?? config.auth.user.expiresIn,
    issuer: config.publicUrl,
  })
  if (token.length > TOKEN_MAX_LENGTH) {
    sentryCaptureException(Boom.internal(`Token généré trop long : ${token.length}`))
  }
  return token
}

function getMethodAndPath<Schema extends SchemaWithSecurity>(scope: IScope<Schema>) {
  if ("schema" in scope) {
    const { schema } = scope
    const { method, path } = schema
    return { method, path }
  } else if ("method" in scope && "path" in scope) {
    const { method, path } = scope
    return { method, path }
  } else {
    assertUnreachable(scope)
  }
}

export function getAccessTokenScope<Schema extends SchemaWithSecurity>(token: IAccessToken<Schema> | null, schema: Schema): IScope<Schema> | null {
  return (
    token?.scopes.find((scope) => {
      const { method, path } = getMethodAndPath(scope)
      return path === schema.path && method === schema.method
    }) ?? null
  )
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
    skipParamsReplacement: false,
  })
  const genericAudience = getAudience({
    method: schema.method,
    path: schema.path,
    options: {},
    skipParamsReplacement: true,
  })
  const tokenAudiences: string[] = scopesToAudiences(token.scopes)
  const isAuthorized = tokenAudiences.includes(specificAudience) || tokenAudiences.includes(genericAudience)
  if (!isAuthorized) {
    throw Boom.forbidden("Les audiences ne correspondent pas")
  }
  return token
}

function scopesToAudiences<Schema extends SchemaWithSecurity>(scopes: ReadonlyArray<IScope<Schema>>) {
  return scopes.map((scope) => {
    const { method, path } = getMethodAndPath(scope)
    return getAudience({
      method,
      path,
      options:
        scope.options === "all"
          ? {}
          : {
              params: scope.options.params,
              querystring: scope.options.querystring,
            },
      skipParamsReplacement: scope.options === "all",
    })
  })
}
