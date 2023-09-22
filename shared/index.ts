import { Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zAppointmentsRoute } from "./routes/appointments.routes"
import { zCoreRoutes } from "./routes/core.routes"
import { zEtablissementRoutes } from "./routes/etablissement.routes"
import { zFormationRoute } from "./routes/formations.routes"

export * from "./models/index"

export const zRoutes = {
  get: {
    ...zCoreRoutes.get,
    ...zEtablissementRoutes.get,
    ...zAppointmentsRoute.get,
    ...zFormationRoute.get,
  },
  post: {
    ...zCoreRoutes.post,
    ...zEtablissementRoutes.post,
    ...zAppointmentsRoute.post,
  },
  patch: {
    ...zEtablissementRoutes.patch,
  },
  put: {
    ...zCoreRoutes.put,
  },
  delete: {
    ...zCoreRoutes.delete,
  },
} as const

export type IRoutes = typeof zRoutes

export type IGetRoutes = IRoutes["get"]
export type IPostRoutes = IRoutes["post"]
export type IPutRoutes = IRoutes["put"]
export type IPatchRoutes = IRoutes["patch"]
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
