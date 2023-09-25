import { z } from "zod"

import { IRoutesDef } from "./common.routes"

export const zUnsubscribeRoute = {
  post: {
    "/api/unsubscribe": {
      body: z.object({ email: z.string().email(), reason: z.string() }).strict(),
      response: {
        "200": z.enum(["OK", "NON_RECONNU", "ETABLISSEMENTS_MULTIPLES"]),
      },
    },
  },
} as const satisfies IRoutesDef
