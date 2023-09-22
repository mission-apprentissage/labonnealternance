import { Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zCoreRoutes } from "./routes/core.routes"
import { zEtablissementRoutes } from "./routes/etablissement.routes"
import { zFormulaireRoute } from "./routes/formulaire.route"
import { zRecruiterRoutes } from "./routes/recruiters.routes"

export * from "./models/index"

export const zRoutes = {
  get: {
    ...zCoreRoutes.get,
    ...zEtablissementRoutes.get,
    ...zRecruiterRoutes.get,
    ...zFormulaireRoute.get,
  },
  post: {
    ...zCoreRoutes.post,
    ...zEtablissementRoutes.post,
    ...zRecruiterRoutes.post,
    ...zFormulaireRoute.post,
  },
  patch: {
    ...zFormulaireRoute.patch,
  },
  put: {
    ...zCoreRoutes.put,
    ...zEtablissementRoutes.put,
    ...zRecruiterRoutes.put,
    ...zFormulaireRoute.put,
  },
  delete: {
    ...zCoreRoutes.delete,
    ...zEtablissementRoutes.delete,
    ...zRecruiterRoutes.delete,
    ...zFormulaireRoute.delete,
  },
} as const

export type IRoutes = typeof zRoutes

export type IGetRoutes = IRoutes["get"]
export type IPostRoutes = IRoutes["post"]
export type IPatchRoutes = IRoutes["patch"]
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
