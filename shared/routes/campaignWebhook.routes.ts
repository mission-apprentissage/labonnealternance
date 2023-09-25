import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zCampaignWebhookRoutes = {
  get: {},
  post: {
    "/api/campaign/webhook": {
      body: extensions.brevoWebhook(),
      response: {
        "200": z
          .object({
            result: z.literal("ok"),
          })
          .strict(),
      },
    },
  },
  put: {},
  delete: {},
  patch: {},
} satisfies IRoutesDef
