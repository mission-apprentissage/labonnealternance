import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import type { IRoutesDef } from "./common.routes.js"

export const zEmailsRoutes = {
  post: {
    "/emails/webhook": {
      method: "post",
      path: "/emails/webhook",
      querystring: z.strictObject({
        apiKey: z.string(),
      }),
      body: extensions.brevoWebhook(),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: null,
    },
    "/emails/webhookHardbounce": {
      method: "post",
      path: "/emails/webhookHardbounce",
      querystring: z.strictObject({
        apiKey: z.string(),
      }),
      body: extensions.brevoWebhook(),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
