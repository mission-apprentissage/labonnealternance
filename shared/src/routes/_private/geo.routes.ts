import { z } from "../../helpers/zod-with-open-api.js"
import { extensions } from "../../helpers/zodHelpers/zod-primitives.js"
import { zReferentielCommune } from "../../models/index.js"
import type { IRoutesDef } from "../common.routes.js"
import { zRefererHeaders } from "../params.js"

export const zPrivateGeoRoutes = {
  get: {
    "/_private/geo/commune/reverse": {
      method: "get",
      path: "/_private/geo/commune/reverse",
      querystring: z.object({
        latitude: extensions.latitude({ coerce: true }),
        longitude: extensions.longitude({ coerce: true }),
      }),
      response: {
        "200": zReferentielCommune,
      },
      headers: zRefererHeaders,
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
