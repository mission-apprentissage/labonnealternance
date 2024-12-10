import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

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
