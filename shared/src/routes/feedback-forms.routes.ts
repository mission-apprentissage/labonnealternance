import { z } from "../helpers/zod-with-open-api.js"
import { ZFeedbackPageContext } from "../models/feedback-display.model.js"
import { FEEDBACK_FORM_MAX_QUESTIONS, ZFeedbackForm, ZFeedbackFormForAdmin, ZFeedbackFormInput, ZFeedbackFormPublic, ZFeedbackFormStatus } from "../models/feedback-form.model.js"
import { FEEDBACK_RESPONSE_STATUS, ZFeedbackAnswer, ZFeedbackFormResults } from "../models/feedback-response.model.js"

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
    "/admin/feedback-forms/:slug/results": {
      method: "get",
      path: "/admin/feedback-forms/:slug/results",
      params: z.strictObject({ slug: z.string() }),
      response: {
        "200": ZFeedbackFormResults,
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
    // public : apparition du bouton « Donner mon avis » sur une page de déclenchement d'un formulaire actif
    "/feedback-forms/:slug/displays": {
      method: "post",
      path: "/feedback-forms/:slug/displays",
      params: z.strictObject({ slug: z.string() }),
      body: ZFeedbackPageContext,
      response: {
        "200": z.strictObject({ display_id: z.string() }),
      },
      securityScheme: null,
    },
    // public : ouverture du panneau, crée le parcours ; le jeton rendu est exigé pour le compléter
    "/feedback-forms/:slug/responses": {
      method: "post",
      path: "/feedback-forms/:slug/responses",
      params: z.strictObject({ slug: z.string() }),
      body: z.strictObject({ display_id: z.string() }),
      response: {
        "200": z.strictObject({ response_id: z.string(), token: z.string() }),
      },
      securityScheme: null,
    },
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
    // public : état complet du parcours à chaque étape (réponses et questions passées), validé contre la définition
    "/feedback-responses/:id": {
      method: "put",
      path: "/feedback-responses/:id",
      params: z.strictObject({ id: z.string() }),
      body: z.strictObject({
        token: z.string(),
        answers: z.array(ZFeedbackAnswer).max(FEEDBACK_FORM_MAX_QUESTIONS),
        skipped: z.array(z.string()).max(FEEDBACK_FORM_MAX_QUESTIONS),
      }),
      response: {
        "200": z.strictObject({ status: z.enum(FEEDBACK_RESPONSE_STATUS) }),
      },
      securityScheme: null,
    },
    // modifie la définition en place ; refusé pour un formulaire qui a des réponses (on en crée un nouveau)
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
