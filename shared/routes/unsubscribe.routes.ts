import { UNSUBSCRIBE_EMAIL_ERRORS } from "../constants/recruteur"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zUnsubscribeRoute = {
  post: {
    // TODO_SECURITY AB Vs. Marion + Abdellah + Léo !! fight !!
    "/unsubscribe": {
      method: "post",
      path: "/unsubscribe",
      body: z.object({ email: z.string().email(), reason: z.string() }).strict(),
      response: {
        "200": z.enum(["OK", ...Object.values(UNSUBSCRIBE_EMAIL_ERRORS)]),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
