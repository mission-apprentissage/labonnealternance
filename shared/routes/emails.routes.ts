import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zEmailsRoutes = {
  // TODO_SECURITY_FIX à ajouter dans le init . ne faire qu'un seul webhook au lieu de trois
  post: {
    "/api/emails/webhook": {
      body: extensions.brevoWebhook(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
