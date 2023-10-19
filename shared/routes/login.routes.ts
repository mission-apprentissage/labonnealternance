import { z } from "../helpers/zodWithOpenApi"
import { ZUserRecruteurPublic } from "../models"

import { IRoutesDef } from "./common.routes"

export const zLoginRoutes = {
  post: {
    "/login/confirmation-email": {
      method: "post",
      path: "/login/confirmation-email",
      // TODO_SECURITY_FIX faire en sorte que le lien magique ne soit pas human readable. Rename en /resend-confirmation-email
      body: z
        .object({
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: null,
    },
    "/login/magiclink": {
      method: "post",
      path: "/login/magiclink",
      body: z
        .object({
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: null,
    },
    "/login/verification": {
      method: "post",
      path: "/login/verification",
      response: {
        "2xx": ZUserRecruteurPublic,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        ressources: {},
      },
    },
  },
  get: {
    "/auth/session": {
      method: "get",
      path: "/auth/session",
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: null,
        ressources: {},
      },
    },
    "/auth/logout": {
      method: "get",
      path: "/auth/logout",
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
