import { z } from "../helpers/zodWithOpenApi"
import { ZUserRecruteurPublic } from "../models"
import { zObjectId } from "../models/common"

import { IRoutesDef } from "./common.routes"

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
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [{ _id: { key: "userId", type: "params" } }],
        },
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
        "2xx": ZUserRecruteurPublic,
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
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
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
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
