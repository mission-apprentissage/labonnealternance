import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import { IRoutesDef } from "./common.routes"

export const zUpdateLbaCompanyRoutes = {
  get: {
    "/updateLBB/updateContactInfo": {
      method: "get",
      path: "/updateLBB/updateContactInfo",
      querystring: z
        .object({
          secret: z.string(),
          siret: extensions.siret,
          email: z.string().email().or(z.literal("")).optional(),
          phone: extensions.phone().or(z.literal("")).optional(),
        })
        .strict(),
      response: {
        "200": z.literal("OK"),
      },
      securityScheme: null,
      openapi: {
        description: `${rateLimitDescription({ max: 1, timeWindow: "20s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
