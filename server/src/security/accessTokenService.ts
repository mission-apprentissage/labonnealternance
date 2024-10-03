import { forbidden, internal } from "@hapi/boom"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { PathParam, QueryString } from "shared/helpers/generateUri"
import { IUserRecruteur } from "shared/models"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { Jsonify } from "type-fest"
import { AnyZodObject, z } from "zod"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import config from "@/config"

import { controlUserState } from "../services/login.service"

// cf https://www.sistrix.com/ask-sistrix/technical-seo/site-structure/url-length-how-long-can-a-url-be
const INTERNET_EXPLORER_V10_MAX_LENGTH = 2083
const OUTLOOK_URL_MAX_LENGTH = 8192
const NGINX_URL_MAX_LENGTH = 4096
const URL_MAX_LENGTH = Math.min(INTERNET_EXPLORER_V10_MAX_LENGTH, OUTLOOK_URL_MAX_LENGTH, NGINX_URL_MAX_LENGTH)
const TOKEN_MAX_LENGTH = URL_MAX_LENGTH - (config.publicUrl.length + 1) // +1 for slash character

export type SchemaWithSecurity = Pick<IRouteSchema, "method" | "path" | "params" | "querystring"> & WithSecurityScheme

type AllowAllType = { allowAll: true }
type AuthorizedValuesRecord<ZodObject> = ZodObject extends AnyZodObject
  ? {
      [Key in keyof Jsonify<z.input<ZodObject>>]: Jsonify<z.input<ZodObject>>[Key] | AllowAllType
    }
  : undefined

type IScope<Schema extends SchemaWithSecurity> = {
  method: Schema["method"]
  path: Schema["path"]
  options:
    | "all"
    | {
        params: AuthorizedValuesRecord<Schema["params"]>
        querystring: AuthorizedValuesRecord<Schema["querystring"]>
      }
}
export const generateScope = <Schema extends SchemaWithSecurity>(scope: Omit<IScope<Schema>, "method" | "path"> & { schema: Schema }): IScope<Schema> => {
  const { schema, options } = scope
  return { options, path: schema.path, method: schema.method }
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
    | { type: "lba-company"; siret: string; email: string }
    | { type: "candidat"; email: string }
    | IApplicationForAccessToken
    | IUserWithAccountForAccessToken
  scopes: ReadonlyArray<IScope<Schema>>
}

export type IUserWithAccountForAccessToken = { type: "IUser2"; email: string; _id: string }

export type UserForAccessToken = IUserRecruteur | IAccessToken["identity"]

export const userWithAccountToUserForToken = (user: IUserWithAccount): IUserWithAccountForAccessToken => ({ type: "IUser2", _id: user._id.toString(), email: user.email })

export type IApplicationForAccessToken = { type: "application"; company_siret: string; email: "" } | { type: "application"; jobId: string; email: "" }
export type IApplicationTForUserToken = { company_siret?: string; jobId?: string }

export const applicationToUserForToken = ({ company_siret, jobId }: IApplicationTForUserToken): IApplicationForAccessToken => {
  if (company_siret) {
    return { type: "application", company_siret, email: "" }
  } else {
    return { type: "application", jobId: jobId as string, email: "" }
  }
}

export function generateAccessToken(user: UserForAccessToken, scopes: ReadonlyArray<IScope<SchemaWithSecurity>>, options: { expiresIn?: string } = {}): string {
  const identity: IAccessToken["identity"] = "_id" in user ? { type: "IUser2", _id: user._id.toString(), email: user.email.toLowerCase() } : user
  const data: IAccessToken<SchemaWithSecurity> = {
    identity,
    scopes,
  }

  const token = jwt.sign(data, config.auth.user.jwtSecret, {
    expiresIn: options.expiresIn ?? config.auth.user.expiresIn,
    issuer: config.publicUrl,
  })
  if (token.length > TOKEN_MAX_LENGTH) {
    sentryCaptureException(internal(`Token généré trop long : ${token.length}`))
  }
  return token
}

function isAllowAllValue(x: unknown): x is AllowAllType {
  return !!x && typeof x === "object" && "allowAll" in x && x.allowAll === true
}

function isAuthorizedParam(requiredValue: string, allowedValue: string | undefined | AllowAllType) {
  return requiredValue === allowedValue || isAllowAllValue(allowedValue)
}

export function getAccessTokenScope<Schema extends SchemaWithSecurity>(
  token: IAccessToken<Schema> | null,
  schema: Schema,
  params: PathParam | undefined,
  querystring: QueryString | undefined
): IScope<Schema> | null {
  return (
    token?.scopes.find((scope) => {
      const { method, path } = scope
      if (path !== schema.path || method !== schema.method) {
        return false
      }

      if (scope.options === "all") {
        return true
      }

      if (params) {
        const allowedParams = scope.options.params
        const isAuthorized = Object.entries(params).every(([key, requiredValue]) => {
          const allowedParam = allowedParams?.[key]
          return isAuthorizedParam(requiredValue, allowedParam)
        })
        if (!isAuthorized) {
          return false
        }
      }

      if (querystring) {
        const allowedQueryString = scope.options.querystring
        const isAuthorized = Object.entries(querystring).every(([key, value]) => {
          const requiredValues = Array.isArray(value) ? new Set(value) : new Set([value])
          const allowedValues = (allowedQueryString?.[key] ?? []) as string[] | string | AllowAllType
          if (isAllowAllValue(allowedValues)) {
            return true
          }

          if (Array.isArray(allowedValues)) {
            for (const allowedValue of allowedValues) {
              requiredValues.delete(allowedValue)
            }
          } else {
            requiredValues.delete(allowedValues)
          }

          return requiredValues.size === 0
        })
        if (!isAuthorized) {
          return false
        }
      }

      return true
    }) ?? null
  )
}

// TODO on devrait pouvoir le supprimer ainsi que controlUserState
const authorizedPaths = [
  "/etablissement/validation",
  "/formulaire/:establishment_id/by-token",
  "/formulaire/:establishment_id/offre/by-token",
  "/formulaire/offre/:jobId/delegation/by-token",
  "/user/status/:userId/by-token",
]

export const verifyJwtToken = (jwtToken: string) => {
  try {
    const data = jwt.verify(jwtToken, config.auth.user.jwtSecret, {
      complete: true,
      issuer: config.publicUrl,
    })
    const token = data.payload as IAccessToken<any>
    return token
  } catch (err: any) {
    const errorStr = err + ""
    if (errorStr === "TokenExpiredError: jwt expired") {
      throw forbidden("JWT expired")
    }
    console.warn("invalid jwt token", jwtToken, err)
    throw forbidden()
  }
}

export async function parseAccessToken<Schema extends SchemaWithSecurity>(
  jwtToken: string,
  schema: Schema,
  params: PathParam | undefined,
  querystring: QueryString | undefined
): Promise<IAccessToken<Schema>> {
  const token = verifyJwtToken(jwtToken) as IAccessToken<Schema>
  if (token.identity.type === "IUserRecruteur") {
    const user = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(token.identity._id) })

    if (!user) throw forbidden()

    const userStatus = await controlUserState(user)

    if (userStatus.error && !authorizedPaths.includes(schema.path)) {
      throw forbidden()
    }
  }
  const scopeOpt = getAccessTokenScope(token, schema, params, querystring)
  if (!scopeOpt) {
    throw forbidden("Aucun scope ne correspond")
  }
  return token
}
