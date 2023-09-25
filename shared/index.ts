import { Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zApplicationRoutes } from "./routes/application.routes"
import { zCampaignWebhookRoutes } from "./routes/campaignWebhook.routes"
import { IRouteSchema } from "./routes/common.routes"
import { zAppointmentsRoute } from "./routes/appointments.routes"
import { zCoreRoutes } from "./routes/core.routes"
import { zEtablissementRoutes } from "./routes/etablissement.routes"
import { zFormulaireRoute } from "./routes/formulaire.route"
import { zLoginRoutes } from "./routes/login.routes"
import { zMetiersDAvenirRoutes } from "./routes/metiersdavenir.routes"
import { zOptoutRoutes } from "./routes/optout.routes"
import { zRecruiterRoutes } from "./routes/recruiters.routes"
import { zRomeRoutes } from "./routes/rome.routes"
import { zTrainingLinksRoutes } from "./routes/trainingLinks.routes"
import { zUnsubscribeRoute } from "./routes/unsubscribe.routes"
import { zUpdateLbaCompanyRoutes } from "./routes/updateLbaCompany.routes"
import { zUserRecruteurRoutes } from "./routes/user.routes"
import { zV1FormationsParRegion } from "./routes/v1FormationsParRegion.routes"
import { zV1JobsRoutes } from "./routes/v1Jobs.routes"
import { zV1JobsEtFormationsRoutes } from "./routes/v1JobsEtFormations.routes"
import { zFormationRoute } from "./routes/formations.routes"

export * from "./models/index"

const zRoutesGet = {
  ...zCoreRoutes.get,
  ...zEtablissementRoutes.get,
  ...zMetiersDAvenirRoutes.get,
  ...zOptoutRoutes.get,
  ...zRomeRoutes.get,
  ...zUpdateLbaCompanyRoutes.get,
  ...zUserRecruteurRoutes.get,
  ...zV1FormationsParRegion.get,
  ...zV1JobsRoutes.get,
  ...zV1JobsEtFormationsRoutes.get,
  ...zFormulaireRoute.get,
  ...zRecruiterRoutes.get,
  ...zCampaignWebhookRoutes.get,
  ...zAppointmentsRoute.get,
  ...zFormationRoute.get,
} as const

const zRoutesPost = {
  ...zApplicationRoutes.post,
  ...zLoginRoutes.post,
  ...zTrainingLinksRoutes.post,
  ...zUnsubscribeRoute.post,
  ...zUserRecruteurRoutes.post,
  ...zV1JobsRoutes.post,
  ...zFormulaireRoute.post,
  ...zRecruiterRoutes.post,
  ...zCampaignWebhookRoutes.post,
  ...zCoreRoutes.post,
  ...zEtablissementRoutes.post,
  ...zAppointmentsRoute.post,
} as const

const zRoutesPut = {
  ...zUserRecruteurRoutes.put,
  ...zFormulaireRoute.put,
  ...zRecruiterRoutes.put,
  ...zCoreRoutes.put,
} as const

const zRoutesDelete = {
  ...zUserRecruteurRoutes.delete,
  ...zFormulaireRoute.delete,
  ...zCoreRoutes.delete,
} as const

const zRoutesPatch = {
  ...zV1JobsRoutes.patch,
  ...zFormulaireRoute.patch,
  ...zEtablissementRoutes.patch,
} as const

type ZRoutes = {
  get: typeof zRoutesGet
  post: typeof zRoutesPost
  put: typeof zRoutesPut
  delete: typeof zRoutesDelete
  patch: typeof zRoutesPatch
}

export const zRoutes: ZRoutes = {
  get: zRoutesGet,
  post: zRoutesPost,
  put: zRoutesPut,
  delete: zRoutesDelete,
  patch: zRoutesPatch,
} as const

export type IRoutes = typeof zRoutes

export type IGetRoutes = IRoutes["get"]
export type IPostRoutes = IRoutes["post"]
export type IPatchRoutes = IRoutes["patch"]
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
