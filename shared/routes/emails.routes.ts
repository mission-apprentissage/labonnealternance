import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zEmailsRoutes = {
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
