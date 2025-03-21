import { z } from "../helpers/zodWithOpenApi.js"
import { ZMetiersEnrichis } from "../models/diplomesMetiers.model.js"
import { ZReferentielRomeForJob } from "../models/rome.model.js"

import { IRoutesDef } from "./common.routes.js"

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
        "200": ZReferentielRomeForJob,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
