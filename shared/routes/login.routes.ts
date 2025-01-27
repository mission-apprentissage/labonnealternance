import { zObjectId } from "zod-mongodb-schema"

import { z } from "../helpers/zodWithOpenApi.js"
import { ZComputedUserAccess } from "../models/computedUserAccess.model.js"
import { ZUserRecruteurPublic } from "../models/usersRecruteur.model.js"

import { IRoutesDef } from "./common.routes.js"

export const zLoginRoutes = {
  post: {
    "/login/:userId/resend-confirmation-email": {
      method: "post",
      path: "/login/:userId/resend-confirmation-email",
      params: z
        .object({
          userId: zObjectId,
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
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
        "200": ZUserRecruteurPublic,
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
  get: {
    "/auth/session": {
      method: "get",
      path: "/auth/session",
      response: {
        "200": ZUserRecruteurPublic,
      },
      securityScheme: {
        auth: "cookie-session",
        access: null,
        skipLogAccess: true,
        resources: {},
      },
    },
    "/auth/access": {
      method: "get",
      path: "/auth/access",
      response: {
        "200": ZComputedUserAccess,
      },
      securityScheme: {
        auth: "cookie-session",
        access: null,
        resources: {},
      },
    },
    "/auth/logout": {
      method: "get",
      path: "/auth/logout",
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
