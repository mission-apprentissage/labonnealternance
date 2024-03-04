import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zEmailsRoutes = {
  post: {
    "/emails/webhook": {
      method: "post",
      path: "/emails/webhook",
      querystring: z
        .object({
          apiKey: z.string(),
        })
        .strict(),
      body: extensions.brevoWebhook(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: null,
    },
    "/emails/webhookHardbounce": {
      method: "post",
      path: "/emails/webhookHardbounce",
      querystring: z
        .object({
          apiKey: z.string(),
        })
        .strict(),
      body: extensions.brevoWebhook(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
