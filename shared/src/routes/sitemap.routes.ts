import { z } from "../helpers/zodWithOpenApi.js"

import { IRoutesDef } from "./common.routes.js"

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
