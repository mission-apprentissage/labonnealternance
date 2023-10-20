import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zCampaignWebhookRoutes = {
  post: {
    "/campaign/webhook": {
      method: "post",
      path: "/campaign/webhook",
      querystring: z
        .object({
          apikey: z.string(),
        })
        .strict(),
      body: extensions.brevoWebhook(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
          })
          .strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
