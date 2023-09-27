import { Jsonify } from "type-fest"
import { AnyZodObject, ZodType } from "zod"
import { ZodOpenApiOperationObject } from "zod-openapi"

import { z } from "../helpers/zodWithOpenApi"

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

export type AuthStrategy = "api-key" | "basic" | "jwt-password" | "jwt-bearer" | "jwt-token" | "jwt-rdv-admin" | "none"

export type SecurityScheme = {
  auth: AuthStrategy
  role: "admin" | "all" | "administrator"
}

export interface IRouteSchemaGet {
  querystring?: AnyZodObject
  headers?: AnyZodObject
  params?: AnyZodObject
  response: { [statuscode: `${1 | 2 | 3 | 4 | 5}${string}`]: ZodType }
  openapi?: null | Omit<ZodOpenApiOperationObject, "parameters" | "requestBody" | "requestParams" | "responses">
  securityScheme: SecurityScheme
}

export interface IRouteSchema extends IRouteSchemaGet {
  body?: ZodType
}

export type IRoutesDef = {
  get?: Record<string, IRouteSchemaGet>
  post?: Record<string, IRouteSchema>
  put?: Record<string, IRouteSchema>
  delete?: Record<string, IRouteSchema>
  patch?: Record<string, IRouteSchema>
}
