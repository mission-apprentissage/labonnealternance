import { OpenAPIV3 } from "@asteasolutions/zod-to-openapi"
import { Jsonify } from "type-fest"
import { AnyZodObject, ZodType } from "zod"

import { z } from "../helpers/zodWithOpenApi"

export const ZResError = z
  .object({
    data: z
      .any()
      .optional()
      .openapi({
        description: "Données contextuelles liées à l'erreur",
        example: {
          validationError: {
            issues: [
              {
                code: "invalid_type",
                expected: "number",
                received: "nan",
                path: ["longitude"],
                message: "Number attendu",
              },
            ],
            name: "ZodError",
            statusCode: 400,
            code: "FST_ERR_VALIDATION",
            validationContext: "querystring",
          },
        },
      }),
    message: z.string().openapi({
      description: "Un message explicatif de l'erreur",
      example: "querystring.longitude: Number attendu",
    }),
    error: z.string().openapi({
      description: "Le type générique de l'erreur",
      example: "Bad Request",
    }),
    statusCode: z.number().openapi({
      description: "Le status code retourné",
      example: 400,
    }),
  })
  .strict()
  .openapi("Error")

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

export type AuthStrategy = "api-key" | "basic" | "jwt-password" | "jwt-bearer" | "jwt-token" | "cookie-session" | "none"

export type SecurityScheme = {
  auth: AuthStrategy
  role: "admin" | "all" | "administrator"
}

export interface IRouteSchemaGet {
  querystring?: AnyZodObject
  headers?: AnyZodObject
  params?: AnyZodObject
  response: { [statuscode: `${1 | 2 | 3 | 4 | 5}${string}`]: ZodType }
  openapi?: null | Omit<OpenAPIV3.OperationObject, "parameters" | "requestBody" | "requestParams" | "responses">
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
