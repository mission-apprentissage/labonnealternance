import { z } from "../helpers/zodWithOpenApi.js"

import type { IRoutesDef } from "./common.routes.js"

export const zPartnersRoutes = {
  get: {
    "/partners/parcoursup/formations": {
      method: "get",
      path: "/partners/parcoursup/formations",
      response: {
        "200": z.object({ ids: z.array(z.string()) }).strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
