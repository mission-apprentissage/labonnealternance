import { z } from "../helpers/zod-with-open-api.js"

import type { IRoutesDef } from "./common.routes.js"

export const zPartnersRoutes = {
  get: {
    "/partners/parcoursup/formations": {
      method: "get",
      path: "/partners/parcoursup/formations",
      response: {
        "200": z.strictObject({ ids: z.array(z.string()) }),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
