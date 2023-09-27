import { z } from "zod"

import { IRoutesDef } from "./common.routes"

export const zUnsubscribeRoute = {
  post: {
    // TODO_SECURITY AB Vs. Marion + Abdellah + Léo !! fight !!
    "/api/unsubscribe": {
      body: z.object({ email: z.string().email(), reason: z.string() }).strict(),
      response: {
        "200": z.enum(["OK", "NON_RECONNU", "ETABLISSEMENTS_MULTIPLES"]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
