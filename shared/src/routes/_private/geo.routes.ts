import { extensions } from "../../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../../helpers/zodWithOpenApi.js"
import { zReferentielCommune } from "../../models/index.js"
import { zRefererHeaders } from "../_params.js"
import { IRoutesDef } from "../common.routes.js"

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
