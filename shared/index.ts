import { Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zAdminAppointementsRoutes } from "./routes/adminAppointments.routes"
import { zApplicationRoutes } from "./routes/application.routes"
import { zAppointmentsRoute } from "./routes/appointments.routes"
import { zCampaignWebhookRoutes } from "./routes/campaignWebhook.routes"
import { IRouteSchema } from "./routes/common.routes"
import { zCoreRoutes } from "./routes/core.routes"
import { zEligibleTrainingsForAppointmentRoutes } from "./routes/eligibleTrainingsForAppointment.routes"
import { zEmailsRoutes } from "./routes/emails.routes"
import { zEtablissementRoutes } from "./routes/etablissement.routes"
import { zFormationRoute } from "./routes/formations.routes"
import { zFormulaireRoute } from "./routes/formulaire.route"
import { zLoginRoutes } from "./routes/login.routes"
import { zMetiersRoutes } from "./routes/metiers.routes"
import { zMetiersDAvenirRoutes } from "./routes/metiersdavenir.routes"
import { zOptoutRoutes } from "./routes/optout.routes"
import { zPartnersRoutes } from "./routes/partners.routes"
import { zAuthPasswordRoutes } from "./routes/password.routes"
import { zRecruiterRoutes } from "./routes/recruiters.routes"
import { zRomeRoutes } from "./routes/rome.routes"
import { zMailRoutes } from "./routes/sendMail.routes"
import { zTrainingLinksRoutes } from "./routes/trainingLinks.routes"
import { zUnsubscribeRoute } from "./routes/unsubscribe.routes"
import { zUpdateLbaCompanyRoutes } from "./routes/updateLbaCompany.routes"
import { zUserRecruteurRoutes } from "./routes/user.routes"
import { zV1FormationsRoutes } from "./routes/v1Formations.routes"
import { zV1FormationsParRegion } from "./routes/v1FormationsParRegion.routes"
import { zV1JobsRoutes } from "./routes/v1Jobs.routes"
import { zV1JobsEtFormationsRoutes } from "./routes/v1JobsEtFormations.routes"

export * from "./models"

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
} as const

const zRoutesGetP2 = {
  ...zV1JobsRoutes.get,
  ...zV1FormationsRoutes.get,
  ...zV1JobsEtFormationsRoutes.get,
  ...zFormulaireRoute.get,
  ...zRecruiterRoutes.get,
  ...zAppointmentsRoute.get,
  ...zFormationRoute.get,
  ...zEligibleTrainingsForAppointmentRoutes.get,
  ...zMailRoutes.get,
  ...zAdminAppointementsRoutes.get,
} as const

const zRoutesGet: typeof zRoutesGetP1 & typeof zRoutesGetP2 = {
  ...zRoutesGetP1,
  ...zRoutesGetP2,
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
  ...zAuthPasswordRoutes.post,
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

export type IResponse<S extends IRouteSchema> = S["response"]["2xx"] extends ZodType ? Jsonify<z.output<S["response"]["2xx"]>> : never

export type IBody<S extends IRouteSchema> = S["body"] extends ZodType ? z.input<S["body"]> : never

export type IQuery<S extends IRouteSchema> = S["querystring"] extends ZodType ? z.input<S["querystring"]> : never

export type IParam<S extends IRouteSchema> = S["params"] extends ZodType ? z.input<S["params"]> : never

export type IHeaders<S extends IRouteSchema> = S["headers"] extends ZodType ? z.input<S["headers"]> : never

export type IRequest<S extends IRouteSchema> = {
  [Prop in keyof Omit<S, "response">]: S[Prop] extends ZodType ? z.input<S[Prop]> : never
}
