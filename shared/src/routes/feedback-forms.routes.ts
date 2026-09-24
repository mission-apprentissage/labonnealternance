import { z } from "../helpers/zod-with-open-api.js"
import { ZFeedbackForm, ZFeedbackFormForAdmin, ZFeedbackFormInput, ZFeedbackFormPublic, ZFeedbackFormStatus } from "../models/feedback-form.model.js"

import type { IRoutesDef } from "./common.routes.js"

const adminSecurity = {
  auth: "cookie-session",
  access: "admin",
  resources: {},
} as const

export const zFeedbackFormsRoutes = {
  get: {
    // public : le widget du site choisit lui-même le formulaire de la page courante (cf. matchesScope)
    "/feedback-forms/active": {
      method: "get",
      path: "/feedback-forms/active",
      response: {
        "200": z.strictObject({ forms: z.array(ZFeedbackFormPublic) }),
      },
      securityScheme: null,
    },
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
    // exige un formulaire publiable (au moins une question) et aucun autre formulaire actif sur ses chemins
    "/admin/feedback-forms/:slug/activate": {
      method: "post",
      path: "/admin/feedback-forms/:slug/activate",
      params: z.strictObject({ slug: z.string() }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: adminSecurity,
    },
    "/admin/feedback-forms/:slug/deactivate": {
      method: "post",
      path: "/admin/feedback-forms/:slug/deactivate",
      params: z.strictObject({ slug: z.string() }),
      response: {
        "200": z.strictObject({}),
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
    // brouillons et archivés : un formulaire actif ou inactif s'archive d'abord
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
