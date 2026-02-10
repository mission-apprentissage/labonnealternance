import { z } from "../helpers/zodWithOpenApi.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

const zInserJeunesStatsResponse = z.unknown()

export const zInserJeunesRoutes = {
  get: {
    "/inserjeunes/:zipcode/:cfd": {
      method: "get",
      path: "/inserjeunes/:zipcode/:cfd",
      params: z
        .object({
          zipcode: z.string().describe("Code postal de la région"),
          cfd: z.string().describe("Code Formation Diplôme"),
        })
        .strict(),
      response: {
        "200": zInserJeunesStatsResponse,
        "404": ZResError,
        "500": ZResError,
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
