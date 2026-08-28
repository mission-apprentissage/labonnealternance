import { z } from "../../helpers/zod-with-open-api.js"
import { ZAppellationsRomes } from "../../models/diplomes-metiers.model.js"
import type { IRoutesDef } from "../common.routes.js"

export const zPrivateMetiersRoutes = {
  get: {
    "/_private/metiers/intitule": {
      method: "get",
      path: "/_private/metiers/intitule",
      querystring: z.strictObject({
        label: z.string().min(1),
      }),
      response: {
        200: ZAppellationsRomes.strict(),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
