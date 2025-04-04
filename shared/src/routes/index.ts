import { ConditionalExcept, EmptyObject, Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zPrivateGeoRoutes } from "./_private/geo.routes.js"
import { zApplicationRoutes } from "./application.routes.js"
import { zAppointmentsRoute } from "./appointments.routes.js"
import { IRouteSchema, IRouteSchemaWrite } from "./common.routes.js"
import { zCoreRoutes } from "./core.routes.js"
import { zEligibleTrainingsForAppointmentRoutes } from "./eligibleTrainingsForAppointment.routes.js"
import { zEmailsRoutes } from "./emails.routes.js"
import { zEtablissementRoutes } from "./etablissement.routes.js"
import { zFormationsRoutes } from "./formations.routes.js"
import { zV1FormationsParRegion } from "./formationsParRegion.routes.js"
import { zFormulaireRoute } from "./formulaire.route.js"
import { zV1JobsRoutes } from "./jobs.routes.js"
import { zV1JobsEtFormationsRoutes } from "./jobsEtFormations.routes.js"
import { zLoginRoutes } from "./login.routes.js"
import { zMetiersRoutes } from "./metiers.routes.js"
import { zMetiersDAvenirRoutes } from "./metiersdavenir.routes.js"
import { zPartnersRoutes } from "./partners.routes.js"
import { zRecruiterRoutes } from "./recruiters.routes.js"
import { zReportedCompanyRoutes } from "./reportedCompany.routes.js"
import { zRomeRoutes } from "./rome.routes.js"
import { zSitemapRoutes } from "./sitemap.routes.js"
import { zTrainingLinksRoutes } from "./trainingLinks.routes.js"
import { zUnsubscribeRoute } from "./unsubscribe.routes.js"
import { zUpdateLbaCompanyRoutes } from "./updateLbaCompany.routes.js"
import { zUserRecruteurRoutes } from "./user.routes.js"
import { zApplicationRoutesV2 } from "./v2/application.routes.v2.js"
import { zAppointmentsRouteV2 } from "./v2/appointments.routes.v2.js"
import { zJobsRoutesV2 } from "./v2/jobs.routes.v2.js"
import { zJobsRoutesV3 } from "./v3/jobs/jobs.routes.v3.js"

const zRoutesGetP1 = {
  ...zCoreRoutes.get,
  ...zEtablissementRoutes.get,
  ...zMetiersDAvenirRoutes.get,
  ...zMetiersRoutes.get,
  ...zPrivateGeoRoutes.get,
} as const

const zRoutesGetP2 = {
  ...zV1JobsRoutes.get,
  ...zApplicationRoutes.get,
  ...zSitemapRoutes.get,
} as const

const zRoutesGetP3 = {
  ...zAppointmentsRoute.get,
  ...zEligibleTrainingsForAppointmentRoutes.get,
  ...zFormationsRoutes.get,
} as const

const zRoutesGetP4 = {
  ...zRomeRoutes.get,
  ...zUpdateLbaCompanyRoutes.get,
  ...zUserRecruteurRoutes.get,
  ...zV1FormationsParRegion.get,
  ...zPartnersRoutes.get,
  ...zLoginRoutes.get,
} as const

const zRoutesGetP5 = {
  ...zV1JobsEtFormationsRoutes.get,
  ...zFormulaireRoute.get,
  ...zRecruiterRoutes.get,
  ...zJobsRoutesV2.get,
  ...zJobsRoutesV3.get,
} as const

const zRoutesGet: typeof zRoutesGetP1 & typeof zRoutesGetP2 & typeof zRoutesGetP3 & typeof zRoutesGetP4 & typeof zRoutesGetP5 = {
  ...zRoutesGetP1,
  ...zRoutesGetP2,
  ...zRoutesGetP3,
  ...zRoutesGetP4,
  ...zRoutesGetP5,
} as const

const zRoutesPost1 = {
  ...zApplicationRoutes.post,
  ...zLoginRoutes.post,
  ...zTrainingLinksRoutes.post,
  ...zUnsubscribeRoute.post,
  ...zUserRecruteurRoutes.post,
  ...zV1JobsRoutes.post,
} as const

const zRoutesPost2 = {
  ...zFormulaireRoute.post,
  ...zRecruiterRoutes.post,
  ...zApplicationRoutesV2.post,
  ...zAppointmentsRouteV2.post,
}

const zRoutesPost3 = {
  ...zEtablissementRoutes.post,
  ...zAppointmentsRoute.post,
  ...zEmailsRoutes.post,
  ...zJobsRoutesV2.post,
  ...zReportedCompanyRoutes.post,
  ...zJobsRoutesV3.post,
}

const zRoutesPost = {
  ...zRoutesPost1,
  ...zRoutesPost2,
  ...zRoutesPost3,
} as const

const zRoutesPut = {
  ...zUserRecruteurRoutes.put,
  ...zFormulaireRoute.put,
  ...zUpdateLbaCompanyRoutes.put,
  ...zJobsRoutesV3.put,
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

export type IGetRoutes = typeof zRoutesGet
export type IPostRoutes = typeof zRoutesPost
export type IPatchRoutes = typeof zRoutesPatch
export type IPutRoutes = typeof zRoutesPut
export type IDeleteRoutes = typeof zRoutesDelete

export type IRoutes = {
  get: IGetRoutes
  post: IPostRoutes
  put: IPutRoutes
  delete: IDeleteRoutes
  patch: IPatchRoutes
}

export type IRoutesPath = {
  get: keyof IRoutes["get"]
  post: keyof IRoutes["post"]
  put: keyof IRoutes["put"]
  delete: keyof IRoutes["delete"]
  patch: keyof IRoutes["patch"]
}

export const zRoutes: IRoutes = {
  get: zRoutesGet,
  post: zRoutesPost,
  put: zRoutesPut,
  delete: zRoutesDelete,
  patch: zRoutesPatch,
} as const

export type IResponse<S extends IRouteSchema> = S["response"][`200`] extends ZodType
  ? Jsonify<z.output<S["response"][`200`]>>
  : S["response"][`2${string}`] extends ZodType
    ? Jsonify<z.output<S["response"][`2${string}`]>>
    : never

export type IBody<S extends IRouteSchemaWrite> = S["body"] extends ZodType ? z.input<S["body"]> : never

export type IQuery<S extends IRouteSchema> = S["querystring"] extends ZodType ? z.input<S["querystring"]> : never

export type IParam<S extends IRouteSchema> = S["params"] extends ZodType ? z.input<S["params"]> : never

type IHeadersAuth<S extends IRouteSchema> = S extends { securityScheme: { auth: infer A } } ? (A extends "access-token" ? { authorization: `Bearer ${string}` } : object) : object

type IHeaders<S extends IRouteSchema> = S["headers"] extends ZodType ? Omit<z.input<S["headers"]>, "referrer"> : object

type IRequestRaw<S extends IRouteSchema> = {
  params: IParam<S>
  querystring: IQuery<S>
  headers: IHeaders<S> & IHeadersAuth<S> extends EmptyObject ? never : IHeaders<S> & IHeadersAuth<S>
  body: S extends IRouteSchemaWrite ? IBody<S> : never
}

export type IRequestFetchOptions = {
  timeout?: number
  headers?: Record<string, string>
  signal?: AbortSignal | null
  priority?: "low" | "auto" | "high"
}

export type IRequest<S extends IRouteSchema> = ConditionalExcept<IRequestRaw<S>, never>

export type IApiVersion = "V1" | "V2"
