import { z } from "../helpers/zodWithOpenApi.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

const zInserJeuneStatsResponse = z.unknown()

export const zInserJeuneRoutes = {
  get: {
    "/inserjeune/:zipcode/:cfd": {
      method: "get",
      path: "/inserjeune/:zipcode/:cfd",
      params: z
        .object({
          zipcode: z.string().describe("Code postal de la région"),
          cfd: z.string().describe("Code Formation Diplôme"),
        })
        .strict(),
      response: {
        "200": zInserJeuneStatsResponse,
        "404": ZResError,
        "500": ZResError,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
