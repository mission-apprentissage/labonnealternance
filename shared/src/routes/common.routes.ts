import type { Jsonify } from "type-fest"
import type { AnyZodObject, ZodEffects, ZodType } from "zod"

import { z } from "../helpers/zodWithOpenApi.js"
import type { AccessPermission, AccessRessouces } from "../security/permissions.js"

export const ZResError = z
  .object({
    data: z.any().optional(),
    message: z.string(),
    error: z.string(),
    statusCode: z.number(),
  })
  .strict()

export const ZResOk = z.object({}).strict()

export type IResError = z.input<typeof ZResError>
export type IResErrorJson = Jsonify<z.output<typeof ZResError>>

export const ZReqParamsSearchPagination = z
  .object({
    page: z.preprocess((v) => parseInt(v as string, 10), z.number().positive().optional()),
    limit: z.preprocess((v) => parseInt(v as string, 10), z.number().positive().optional()),
    q: z.string().optional(),
  })
  .strict()
export type IReqParamsSearchPagination = z.input<typeof ZReqParamsSearchPagination>

export const ZReqHeadersAuthorization = z
  .object({
    Authorization: z.string().describe("Bearer token").optional(),
  })
  .strict()

export type AuthStrategy = "api-key" | "cookie-session" | "access-token" | "api-apprentissage"

export type SecurityScheme = {
  auth: AuthStrategy
  access: AccessPermission | null
  resources: AccessRessouces
  skipLogAccess?: boolean
}

interface IRouteSchemaCommon {
  path: string
  querystring?: AnyZodObject | ZodEffects<AnyZodObject, any, any>
  headers?: AnyZodObject
  params?: AnyZodObject
  response: { [statuscode: `${1 | 2 | 3 | 4 | 5}${string}`]: ZodType }
  securityScheme: SecurityScheme | null
}

export interface IRouteSchemaGet extends IRouteSchemaCommon {
  method: "get"
}

export interface IRouteSchemaWrite extends IRouteSchemaCommon {
  method: "post" | "put" | "patch" | "delete"
  body?: ZodType
}

export type WithSecurityScheme = {
  securityScheme: SecurityScheme
}

export type IRouteSchema = IRouteSchemaGet | IRouteSchemaWrite
export type ISecuredRouteSchema = IRouteSchema & WithSecurityScheme

export type IRoutesDef = {
  get?: Record<string, IRouteSchemaGet>
  post?: Record<string, IRouteSchemaWrite>
  put?: Record<string, IRouteSchemaWrite>
  delete?: Record<string, IRouteSchemaWrite>
  patch?: Record<string, IRouteSchemaWrite>
}
