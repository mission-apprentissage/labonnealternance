import { z } from "../helpers/zod-with-open-api.js"
import { zObjectId } from "../models/common.js"
import { ZNewsletter, ZNewsletterInput, ZNewsletterPublic } from "../models/newsletter.model.js"

import type { IRoutesDef } from "./common.routes.js"

const adminSecurity = {
  auth: "cookie-session",
  access: "admin",
  resources: {},
} as const

export const zNewslettersRoutes = {
  get: {
    // public : éditions affichées sur la page « La lettre de l'alternance », de la plus récente à la plus ancienne
    "/newsletters": {
      method: "get",
      path: "/newsletters",
      response: {
        "200": z.strictObject({ newsletters: z.array(ZNewsletterPublic) }),
      },
      securityScheme: null,
    },
    "/admin/newsletters": {
      method: "get",
      path: "/admin/newsletters",
      response: {
        "200": z.strictObject({ newsletters: z.array(ZNewsletter) }),
      },
      securityScheme: adminSecurity,
    },
    "/admin/newsletters/:id": {
      method: "get",
      path: "/admin/newsletters/:id",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": ZNewsletter,
      },
      securityScheme: adminSecurity,
    },
  },
  post: {
    "/admin/newsletters": {
      method: "post",
      path: "/admin/newsletters",
      body: ZNewsletterInput,
      response: {
        "200": ZNewsletter,
      },
      securityScheme: adminSecurity,
    },
  },
  put: {
    "/admin/newsletters/:id": {
      method: "put",
      path: "/admin/newsletters/:id",
      params: z.strictObject({ id: zObjectId }),
      body: ZNewsletterInput,
      response: {
        "200": ZNewsletter,
      },
      securityScheme: adminSecurity,
    },
  },
  delete: {
    "/admin/newsletters/:id": {
      method: "delete",
      path: "/admin/newsletters/:id",
      params: z.strictObject({ id: zObjectId }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: adminSecurity,
    },
  },
} as const satisfies IRoutesDef
