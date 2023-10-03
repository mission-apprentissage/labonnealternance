import { z } from "../helpers/zodWithOpenApi"
import { ZOptout } from "../models/optout.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zOptoutRoutes = {
  get: {
    "/optout/validate": {
      // TODO_SECURITY_FIX jwt
      // jwt auth
      response: {
        "200": z.union([
          z.object({ error: z.boolean(), reason: z.string() }).strict(),
          ZOptout.extend({
            email: z.string().email(),
          }).strict(),
        ]),
        "401": z.union([
          z
            .object({
              error: z.boolean(),
              reason: z.string(),
            })
            .strict(),
          ZResError,
        ]),
      },
      securityScheme: {
        auth: "jwt-password",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
