import Boom from "boom"
import jwt from "jsonwebtoken"
import { PathParam, QueryString } from "shared/helpers/generateUri"
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
const TOKEN_MAX_LENGTH = URL_MAX_LENGTH - (config.publicUrl.length + 1) // +1 for slash character

export type SchemaWithSecurity = Pick<IRouteSchema, "method" | "path" | "params" | "querystring"> & WithSecurityScheme

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
    [key in keyof Schema["securityScheme"]["ressources"]]: ReadonlyArray<string>
  }
}

type NewIScope<Schema extends SchemaWithSecurity> = {
  method: Schema["method"]
  path: Schema["path"]
  options:
    | "all"
    | {
        params: Schema["params"] extends AnyZodObject ? Partial<Jsonify<z.input<Schema["params"]>>> : undefined
        querystring: Schema["querystring"] extends AnyZodObject ? Partial<Jsonify<z.input<Schema["querystring"]>>> : undefined
      }
  resources: {
    [key in keyof Schema["securityScheme"]["ressources"]]: ReadonlyArray<string>
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

export function getAccessTokenScope<Schema extends SchemaWithSecurity>(
  token: IAccessToken<Schema> | null,
  schema: Schema,
  params: PathParam | undefined,
  querystring: QueryString | undefined
): IScope<Schema> | null {
  return (
    token?.scopes.find((scope) => {
      const { method, path } = getMethodAndPath(scope)
      if (path !== schema.path || method !== schema.method) {
        return false
      }

      if (scope.options === "all") {
        return true
      }

      if (scope.options.params) {
        const requiredParams = scope.options.params
        for (const [key, requiredValue] of Object.entries(requiredParams)) {
          if (params?.[key] !== requiredValue) {
            return false
          }
        }
      }

      if (scope.options.querystring) {
        const requiredQuerystring = scope.options.querystring
        for (const [key, value] of Object.entries(requiredQuerystring)) {
          const requiredValues = Array.isArray(value) ? new Set(value) : new Set([value])
          const inputValues = querystring?.[key] ?? []

          if (Array.isArray(inputValues)) {
            for (const inputValue of inputValues) {
              requiredValues.delete(inputValue)
            }
          } else {
            requiredValues.delete(inputValues)
          }

          if (requiredValues.size > 0) {
            return false
          }
        }
      }

      return true
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

  const scope = getAccessTokenScope(token, schema, params, querystring)

  if (!scope) {
    throw Boom.forbidden("Aucun scope ne correspond")
  }
  return token
}
