import { z } from "../helpers/zod-with-open-api.js"
import { ZMetiersEnrichis } from "../models/diplomes-metiers.model.js"
import { ZReferentielRomeForJob } from "../models/rome.model.js"

import type { IRoutesDef } from "./common.routes.js"

export const zRomeRoutes = {
  get: {
    "/rome": {
      method: "get",
      path: "/rome",
      querystring: z.strictObject({
        title: z.string(),
        withRomeLabels: z.coerce.boolean<boolean>().optional(),
      }),
      response: {
        "200": ZMetiersEnrichis,
      },
      securityScheme: null,
    },
    "/rome/detail/:rome": {
      method: "get",
      path: "/rome/detail/:rome",
      params: z.strictObject({
        rome: z.string(),
      }),
      response: {
        "200": ZReferentielRomeForJob,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
