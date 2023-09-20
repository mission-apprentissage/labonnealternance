import { Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zCoreRoutes } from "./routes/core.routes"
import { zEtablissementRoutes } from "./routes/etablissement.routes"

export const zRoutes = {
  get: {
    ...zCoreRoutes.get,
    ...zEtablissementRoutes.get,
  },
  post: {
    ...zCoreRoutes.post,
    ...zEtablissementRoutes.post,
  },
  put: {
    ...zCoreRoutes.put,
    ...zEtablissementRoutes.put,
  },
  delete: {
    ...zCoreRoutes.delete,
    ...zEtablissementRoutes.delete,
  },
} as const

export type IRoutes = typeof zRoutes

export type IGetRoutes = IRoutes["get"]
export type IPostRoutes = IRoutes["post"]
export type IPutRoutes = IRoutes["put"]
export type IDeleteRoutes = IRoutes["delete"]

export interface IRouteSchema {
  body?: ZodType
  querystring?: ZodType
  headers?: ZodType<Record<string, string | undefined> | undefined>
  params?: ZodType
  response: { "2xx": ZodType }
}

export type IResponse<S extends IRouteSchema> = S["response"]["2xx"] extends ZodType ? Jsonify<z.output<S["response"]["2xx"]>> : never

export type IBody<S extends IRouteSchema> = S["body"] extends ZodType ? z.input<S["body"]> : never

export type IQuery<S extends IRouteSchema> = S["querystring"] extends ZodType ? z.input<S["querystring"]> : never

export type IParam<S extends IRouteSchema> = S["params"] extends ZodType ? z.input<S["params"]> : never

export type IHeaders<S extends IRouteSchema> = S["headers"] extends ZodType ? z.input<S["headers"]> : never

export type IRequest<S extends IRouteSchema> = {
  [Prop in keyof Omit<S, "response">]: S[Prop] extends ZodType ? z.input<S[Prop]> : never
}
