import { Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zApplicationRoutes } from "./routes/application.routes"
import { IRouteSchema } from "./routes/common.routes"
import { zCoreRoutes } from "./routes/core.routes"
import { zEtablissementRoutes } from "./routes/etablissement.routes"
import { zLoginRoutes } from "./routes/login.routes"
import { zMetiersDAvenirRoutes } from "./routes/metiersdavenir.routes"
import { zOptoutRoutes } from "./routes/optout.routes"
import { zRomeRoutes } from "./routes/rome.routes"
import { zTrainingLinksRoutes } from "./routes/trainingLinks.routes"
import { zUnsubscribeRoute } from "./routes/unsubscribe.routes"
import { zUpdateLbaCompanyRoutes } from "./routes/updateLbaCompany.routes"
import { zUserRecruteurRoutes } from "./routes/user.routes"
import { zV1FormationsParRegion } from "./routes/v1FormationsParRegion.routes"
import { zV1JobsRoutes } from "./routes/v1Jobs.routes"
import { zV1JobsEtFormationsRoutes } from "./routes/v1JobsEtFormations.routes"

export * from "./models/index"

export const zRoutes = {
  get: {
    ...zCoreRoutes.get,
    ...zEtablissementRoutes.get,
    ...zLoginRoutes.get,
    ...zMetiersDAvenirRoutes.get,
    ...zOptoutRoutes.get,
    ...zRomeRoutes.get,
    ...zTrainingLinksRoutes.get,
    ...zUnsubscribeRoute.get,
    ...zUpdateLbaCompanyRoutes.get,
    ...zUserRecruteurRoutes.get,
    ...zV1FormationsParRegion.get,
    ...zV1JobsRoutes.get,
    ...zV1JobsEtFormationsRoutes.get,
  },
  post: {
    ...zApplicationRoutes.post,
    ...zCoreRoutes.post,
    ...zEtablissementRoutes.post,
    ...zLoginRoutes.post,
    ...zMetiersDAvenirRoutes.post,
    ...zOptoutRoutes.post,
    ...zRomeRoutes.post,
    ...zTrainingLinksRoutes.post,
    ...zUnsubscribeRoute.post,
    ...zUpdateLbaCompanyRoutes.post,
    ...zUserRecruteurRoutes.post,
    ...zV1FormationsParRegion.post,
    ...zV1JobsRoutes.post,
    ...zV1JobsEtFormationsRoutes.post,
  },
  put: {
    ...zApplicationRoutes.put,
    ...zCoreRoutes.put,
    ...zEtablissementRoutes.put,
    ...zLoginRoutes.put,
    ...zMetiersDAvenirRoutes.put,
    ...zOptoutRoutes.put,
    ...zRomeRoutes.put,
    ...zTrainingLinksRoutes.put,
    ...zUnsubscribeRoute.put,
    ...zUpdateLbaCompanyRoutes.put,
    ...zUserRecruteurRoutes.put,
    ...zV1FormationsParRegion.put,
    ...zV1JobsRoutes.put,
    ...zV1JobsEtFormationsRoutes.put,
  },
  delete: {
    ...zApplicationRoutes.delete,
    ...zCoreRoutes.delete,
    ...zEtablissementRoutes.delete,
    ...zLoginRoutes.delete,
    ...zMetiersDAvenirRoutes.delete,
    ...zOptoutRoutes.delete,
    ...zRomeRoutes.delete,
    ...zTrainingLinksRoutes.delete,
    ...zUnsubscribeRoute.delete,
    ...zUpdateLbaCompanyRoutes.delete,
    ...zUserRecruteurRoutes.delete,
    ...zV1FormationsParRegion.delete,
    ...zV1JobsRoutes.delete,
    ...zV1JobsEtFormationsRoutes.delete,
  },
  patch: {
    ...zApplicationRoutes.patch,
    ...zCoreRoutes.patch,
    ...zEtablissementRoutes.patch,
    ...zLoginRoutes.patch,
    ...zMetiersDAvenirRoutes.patch,
    ...zOptoutRoutes.patch,
    ...zRomeRoutes.patch,
    ...zTrainingLinksRoutes.patch,
    ...zUnsubscribeRoute.patch,
    ...zUpdateLbaCompanyRoutes.patch,
    ...zUserRecruteurRoutes.patch,
    ...zV1FormationsParRegion.patch,
    ...zV1JobsRoutes.patch,
    ...zV1JobsEtFormationsRoutes.patch,
  },
} as const

export type IRoutes = typeof zRoutes

export type IGetRoutes = IRoutes["get"]
export type IPostRoutes = IRoutes["post"]
export type IPutRoutes = IRoutes["put"]
export type IDeleteRoutes = IRoutes["delete"]

export type IResponse<S extends IRouteSchema> = S["response"]["2xx"] extends ZodType ? Jsonify<z.output<S["response"]["2xx"]>> : never

export type IBody<S extends IRouteSchema> = S["body"] extends ZodType ? z.input<S["body"]> : never

export type IQuery<S extends IRouteSchema> = S["querystring"] extends ZodType ? z.input<S["querystring"]> : never

export type IParam<S extends IRouteSchema> = S["params"] extends ZodType ? z.input<S["params"]> : never

export type IHeaders<S extends IRouteSchema> = S["headers"] extends ZodType ? z.input<S["headers"]> : never

export type IRequest<S extends IRouteSchema> = {
  [Prop in keyof Omit<S, "response">]: S[Prop] extends ZodType ? z.input<S[Prop]> : never
}
