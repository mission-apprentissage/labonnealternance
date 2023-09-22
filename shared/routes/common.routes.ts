import { Jsonify } from "type-fest"
import { AnyZodObject, ZodType } from "zod"
import { ZodOpenApiOperationObject } from "zod-openapi"

import { z } from "../helpers/zodWithOpenApi"

export const ZResError = z
  .object({
    details: z.any().optional(),
    attributes: z.any().optional(),
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

export const ZReqHeadersAuthorization = z.object({
  Authorization: z.string().describe("Bearer token").optional(),
})

export interface IRouteSchema {
  body?: ZodType
  querystring?: AnyZodObject
  headers?: ZodType<Record<string, string | undefined> | undefined>
  params?: AnyZodObject
  response: { [statuscode: `${1 | 2 | 3 | 4 | 5}${string}`]: ZodType }
  openapi?: null | Omit<ZodOpenApiOperationObject, "parameters" | "requestBody" | "requestParams" | "responses">
}

export type IRoutesDef = {
  get: Record<string, IRouteSchema>
  post: Record<string, IRouteSchema>
  put: Record<string, IRouteSchema>
  delete: Record<string, IRouteSchema>
  patch: Record<string, IRouteSchema>
}
