import { z } from "../helpers/zod-with-open-api.js"
import { ZFeedbackForm, ZFeedbackFormForAdmin, ZFeedbackFormInput, ZFeedbackFormStatus } from "../models/feedback-form.model.js"

import type { IRoutesDef } from "./common.routes.js"

const adminSecurity = {
  auth: "cookie-session",
  access: "admin",
  resources: {},
} as const

export const zFeedbackFormsRoutes = {
  get: {
    "/admin/feedback-forms": {
      method: "get",
      path: "/admin/feedback-forms",
      querystring: z.object({
        status: z
          .union([ZFeedbackFormStatus, z.array(ZFeedbackFormStatus)])
          .transform((v) => (Array.isArray(v) ? v : [v]))
          .optional(),
      }),
      response: {
        "200": z.strictObject({ forms: z.array(ZFeedbackFormForAdmin) }),
      },
      securityScheme: adminSecurity,
    },
    "/admin/feedback-forms/:slug": {
      method: "get",
      path: "/admin/feedback-forms/:slug",
      params: z.strictObject({ slug: z.string() }),
      response: {
        "200": ZFeedbackFormForAdmin,
      },
      securityScheme: adminSecurity,
    },
  },
  post: {
    "/admin/feedback-forms": {
      method: "post",
      path: "/admin/feedback-forms",
      body: ZFeedbackFormInput,
      response: {
        "200": ZFeedbackForm,
      },
      securityScheme: adminSecurity,
    },
    // état terminal : le formulaire n'est plus affiché ni modifiable, ses réponses sont conservées
    "/admin/feedback-forms/:slug/archive": {
      method: "post",
      path: "/admin/feedback-forms/:slug/archive",
      params: z.strictObject({ slug: z.string() }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: adminSecurity,
    },
  },
  put: {
    // modifie la définition ; sur un formulaire déjà activé, incrémentera la version (étape ultérieure)
    "/admin/feedback-forms/:slug": {
      method: "put",
      path: "/admin/feedback-forms/:slug",
      params: z.strictObject({ slug: z.string() }),
      body: ZFeedbackFormInput.omit({ slug: true }),
      response: {
        "200": ZFeedbackForm,
      },
      securityScheme: adminSecurity,
    },
  },
  delete: {
    // brouillons uniquement : un formulaire déjà affiché aux usagers s'archive, ses réponses restent
    "/admin/feedback-forms/:slug": {
      method: "delete",
      path: "/admin/feedback-forms/:slug",
      params: z.strictObject({ slug: z.string() }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: adminSecurity,
    },
  },
} as const satisfies IRoutesDef
