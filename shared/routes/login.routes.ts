import { z } from "../helpers/zodWithOpenApi"

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
      // TODO_SECURITY_FIX cf. lien magique ci-dessus
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
      querystring: z.object({ token: z.string() }).strict(),
      response: {
        // TODO ANY TO BE FIXED
        "2xx": z.any(),
        // "200": z
        //   .object({
        //     token: z.string(),
        //   })
        //   .strict(),
      },
      securityScheme: {
        auth: "jwt-token",
        access: "user:manage",
        ressources: {
          user: ["self"],
        },
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
        access: "user:manage",
        ressources: {
          user: ["self"],
        },
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
