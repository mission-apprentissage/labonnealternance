import { z } from "../helpers/zodWithOpenApi.js"
import { zObjectId } from "../models/common.js"
import { ZComputedUserAccess } from "../models/computedUserAccess.model.js"
import { ZUserRecruteurPublic } from "../models/usersRecruteur.model.js"
import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

const zLoginError = z.strictObject({ error: z.boolean(), data: z.string().optional() })

export const zLoginRoutes = {
  post: {
    "/login/:userId/resend-confirmation-email": {
      method: "post",
      path: "/login/:userId/resend-confirmation-email",
      params: z.strictObject({
        userId: zObjectId,
      }),
      response: {
        "200": z.strictObject({}),
        "400": z.union([ZResError, zLoginError]),
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
      body: z.strictObject({
        email: z.email(),
      }),
      response: {
        "200": z.strictObject({}),
        "400": z.union([ZResError, zLoginError]),
      },
      securityScheme: null,
    },
    "/login/verification": {
      method: "post",
      path: "/login/verification",
      response: {
        "200": z.object({ user: ZUserRecruteurPublic, sessionToken: z.string() }),
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
        "200": z.strictObject({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
