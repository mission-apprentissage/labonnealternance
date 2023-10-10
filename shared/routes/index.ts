import { ConditionalExcept, EmptyObject, Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zApplicationRoutes } from "./application.routes"
import { zAppointmentsRoute } from "./appointments.routes"
import { zCampaignWebhookRoutes } from "./campaignWebhook.routes"
import { IRouteSchema } from "./common.routes"
import { zCoreRoutes } from "./core.routes"
import { zEligibleTrainingsForAppointmentRoutes } from "./eligibleTrainingsForAppointment.routes"
import { zEmailsRoutes } from "./emails.routes"
import { zEtablissementRoutes } from "./etablissement.routes"
import { zFormationRoute } from "./formations.routes"
import { zFormulaireRoute } from "./formulaire.route"
import { zLoginRoutes } from "./login.routes"
import { zMetiersRoutes } from "./metiers.routes"
import { zMetiersDAvenirRoutes } from "./metiersdavenir.routes"
import { zOptoutRoutes } from "./optout.routes"
import { zPartnersRoutes } from "./partners.routes"
import { zRecruiterRoutes } from "./recruiters.routes"
import { zRomeRoutes } from "./rome.routes"
import { zTrainingLinksRoutes } from "./trainingLinks.routes"
import { zUnsubscribeRoute } from "./unsubscribe.routes"
import { zUpdateLbaCompanyRoutes } from "./updateLbaCompany.routes"
import { zUserRecruteurRoutes } from "./user.routes"
import { zV1FormationsRoutes } from "./v1Formations.routes"
import { zV1FormationsParRegion } from "./v1FormationsParRegion.routes"
import { zV1JobsRoutes } from "./v1Jobs.routes"
import { zV1JobsEtFormationsRoutes } from "./v1JobsEtFormations.routes"

const zRoutesGetP1 = {
  ...zCoreRoutes.get,
  ...zEtablissementRoutes.get,
  ...zMetiersDAvenirRoutes.get,
  ...zMetiersRoutes.get,
  ...zOptoutRoutes.get,
  ...zRomeRoutes.get,
  ...zUpdateLbaCompanyRoutes.get,
  ...zUserRecruteurRoutes.get,
  ...zV1FormationsParRegion.get,
  ...zPartnersRoutes.get,
  ...zLoginRoutes.get,
} as const

const zRoutesGetP2 = {
  ...zV1JobsRoutes.get,
  ...zV1FormationsRoutes.get,
  ...zV1JobsEtFormationsRoutes.get,
  ...zFormulaireRoute.get,
  ...zRecruiterRoutes.get,
  ...zAppointmentsRoute.get,
} as const

const zRoutesGetP3 = {
  ...zEligibleTrainingsForAppointmentRoutes.get,
  ...zFormationRoute.get,
} as const

const zRoutesGet: typeof zRoutesGetP1 & typeof zRoutesGetP2 & typeof zRoutesGetP3 = {
  ...zRoutesGetP1,
  ...zRoutesGetP2,
  ...zRoutesGetP3,
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
  ...zEtablissementRoutes.post,
  ...zAppointmentsRoute.post,
  ...zEmailsRoutes.post,
} as const

const zRoutesPut = {
  ...zUserRecruteurRoutes.put,
  ...zFormulaireRoute.put,
  ...zRecruiterRoutes.put,
} as const

const zRoutesDelete = {
  ...zUserRecruteurRoutes.delete,
  ...zFormulaireRoute.delete,
} as const

const zRoutesPatch = {
  ...zV1JobsRoutes.patch,
  ...zFormulaireRoute.patch,
  ...zEtablissementRoutes.patch,
  ...zEligibleTrainingsForAppointmentRoutes.patch,
} as const

export type IRoutes = {
  get: typeof zRoutesGet
  post: typeof zRoutesPost
  put: typeof zRoutesPut
  delete: typeof zRoutesDelete
  patch: typeof zRoutesPatch
}

export const zRoutes: IRoutes = {
  get: zRoutesGet,
  post: zRoutesPost,
  put: zRoutesPut,
  delete: zRoutesDelete,
  patch: zRoutesPatch,
} as const

export type IGetRoutes = IRoutes["get"]
export type IPostRoutes = IRoutes["post"]
export type IPatchRoutes = IRoutes["patch"]
export type IPutRoutes = IRoutes["put"]
export type IDeleteRoutes = IRoutes["delete"]

export type IResponse<S extends IRouteSchema> = S["response"][`200`] extends ZodType
  ? Jsonify<z.output<S["response"][`200`]>>
  : S["response"][`2${string}`] extends ZodType
  ? Jsonify<z.output<S["response"][`2${string}`]>>
  : never

export type IBody<S extends IRouteSchema> = S["body"] extends ZodType ? z.input<S["body"]> : never

export type IQuery<S extends IRouteSchema> = S["querystring"] extends ZodType ? z.input<S["querystring"]> : never

export type IParam<S extends IRouteSchema> = S["params"] extends ZodType ? z.input<S["params"]> : never

type IHeadersAuth<S extends IRouteSchema> = S["securityScheme"]["auth"] extends "jwt-bearer" ? { authorization: `Bearer ${string}` } : never

export type IHeaders<S extends IRouteSchema> = Omit<S["headers"] extends ZodType ? z.input<S["headers"]> & IHeadersAuth<S> : IHeadersAuth<S>, "referrer">

type IRequestRaw<S extends IRouteSchema> = {
  params: IParam<S>
  querystring: IQuery<S>
  headers: IHeaders<S>
  body: IBody<S>
}

export type IRequest<S extends IRouteSchema> = ConditionalExcept<IRequestRaw<S>, never | EmptyObject>
