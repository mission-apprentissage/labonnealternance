import { Jsonify } from "type-fest"
import z, { ZodType } from "zod"

import { zApplicationRoutes } from "./routes/application.routes"
import { zCampaignWebhookRoutes } from "./routes/campaignWebhook.routes"
import { IRouteSchema } from "./routes/common.routes"
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

export * from "./models/index"

export const zRoutes = {
  get: {
    ...zCampaignWebhookRoutes.get,
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
    ...zFormulaireRoute.get,
    ...zRecruiterRoutes.get,
  },
  post: {
    ...zCampaignWebhookRoutes.post,
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
    ...zFormulaireRoute.post,
    ...zRecruiterRoutes.post,
  },
  put: {
    ...zCampaignWebhookRoutes.put,
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
    ...zFormulaireRoute.put,
    ...zRecruiterRoutes.put,
  },
  delete: {
    ...zCampaignWebhookRoutes.delete,
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
    ...zFormulaireRoute.delete,
    ...zRecruiterRoutes.delete,
  },
  patch: {
    ...zCampaignWebhookRoutes.patch,
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
    ...zFormulaireRoute.patch,
    ...zRecruiterRoutes.patch,
  },
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
