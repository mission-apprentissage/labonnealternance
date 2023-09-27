import { z } from "zod"

import { IRoutesDef } from "./common.routes"

export const zLoginRoutes = {
  post: {
    "/api/login": {
      // TODO_SECURITY_FIX AB s'en occupe
      response: {
        "200": z
          .object({
            token: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "basic",
        role: "all",
      },
    },
    "/api/login/confirmation-email": {
      // TODO_SECURITY_FIX faire en sorte que le lien magique ne soit pas human readable. Rename en /resend-confirmation-email
      body: z
        .object({
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/login/magiclink": {
      // TODO_SECURITY_FIX cf. lien magique ci-dessus
      body: z
        .object({
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/login/verification": {
      // TODO_SECURITY_FIX AB déclencher session ici
      response: {
        "200": z
          .object({
            token: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "jwt-token",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
