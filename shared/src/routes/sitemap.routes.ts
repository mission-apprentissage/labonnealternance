import { z } from "../helpers/zod-with-open-api.js"

import type { IRoutesDef } from "./common.routes.js"

export const zSitemapRoutes = {
  get: {
    "/sitemap-offers.xml": {
      method: "get",
      path: "/sitemap-offers.xml",
      response: {
        "200": z.string(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
