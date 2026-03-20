import { z } from "../helpers/zodWithOpenApi.js"
import type { IRoutesDef } from "./common.routes.js"

export const zV1JobsEtFormationsRoutes = {
  get: {
    "/v1/jobsEtFormations": {
      method: "get",
      path: "/v1/jobsEtFormations",
      response: {
        "410": z.object({
          error: z.string(),
          message: z.string(),
          new_endpoint: z.string(),
        }),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
