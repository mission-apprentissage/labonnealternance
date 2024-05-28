import { z } from "../helpers/zodWithOpenApi"
import { ZMetiersEnrichis, ZReferentielRome } from "../models"

import { IRoutesDef } from "./common.routes"

export const zRomeRoutes = {
  get: {
    "/rome": {
      method: "get",
      path: "/rome",
      querystring: z
        .object({
          title: z.string(),
          withRomeLabels: z.coerce.boolean().optional(),
        })
        .strict(),
      response: {
        "200": ZMetiersEnrichis,
      },
      securityScheme: null,
    },
    "/rome/detail/:rome": {
      method: "get",
      path: "/rome/detail/:rome",
      params: z
        .object({
          rome: z.string(),
        })
        .strict(),
      response: {
        "200": ZReferentielRome,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
