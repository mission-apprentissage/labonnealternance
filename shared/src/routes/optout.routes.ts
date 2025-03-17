import { z } from "../helpers/zodWithOpenApi.js"
import { ZOptout } from "../models/optout.model.js"

import { IRoutesDef, ZResError } from "./common.routes.js"

export const zOptoutRoutes = {
  get: {
    "/optout/validate": {
      method: "get",
      path: "/optout/validate",
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
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
